import stripe
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.billing import Plan, Subscription, UsageRecord

stripe.api_key = settings.stripe_api_key

class BillingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_checkout_session(self, organization_id: uuid.UUID, plan_id: uuid.UUID) -> str:
        plan = await self.db.get(Plan, plan_id)
        if not plan or not plan.stripe_price_id:
            raise ValueError("Invalid plan or plan does not have a stripe price id")
        
        # In a real scenario, you'd find or create the stripe customer for the org.
        # For simplicity, we just create the checkout session with client_reference_id
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': plan.stripe_price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{settings.frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.frontend_url}/billing/cancel",
            client_reference_id=str(organization_id)
        )
        return session.url

    async def handle_webhook(self, payload: bytes, sig_header: str) -> None:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            raise ValueError("Invalid payload or signature")

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            org_id = uuid.UUID(session.get('client_reference_id'))
            customer_id = session.get('customer')
            subscription_id = session.get('subscription')
            
            # Fetch the subscription to get price/plan info
            stripe_sub = stripe.Subscription.retrieve(subscription_id)
            price_id = stripe_sub['items']['data'][0]['price']['id']
            
            result = await self.db.execute(select(Plan).where(Plan.stripe_price_id == price_id))
            plan = result.scalar_one_or_none()
            
            if plan:
                sub_query = await self.db.execute(select(Subscription).where(Subscription.organization_id == org_id))
                existing_sub = sub_query.scalar_one_or_none()
                
                if existing_sub:
                    existing_sub.plan_id = plan.id
                    existing_sub.stripe_customer_id = customer_id
                    existing_sub.stripe_subscription_id = subscription_id
                    existing_sub.status = stripe_sub['status']
                    existing_sub.current_period_end = datetime.fromtimestamp(stripe_sub['current_period_end'], tz=timezone.utc)
                else:
                    new_sub = Subscription(
                        organization_id=org_id,
                        plan_id=plan.id,
                        stripe_customer_id=customer_id,
                        stripe_subscription_id=subscription_id,
                        status=stripe_sub['status'],
                        current_period_end=datetime.fromtimestamp(stripe_sub['current_period_end'], tz=timezone.utc)
                    )
                    self.db.add(new_sub)
                
                await self.db.commit()

        elif event['type'] in ['customer.subscription.updated', 'customer.subscription.deleted']:
            stripe_sub = event['data']['object']
            subscription_id = stripe_sub['id']
            
            result = await self.db.execute(select(Subscription).where(Subscription.stripe_subscription_id == subscription_id))
            subscription = result.scalar_one_or_none()
            
            if subscription:
                subscription.status = stripe_sub['status']
                subscription.current_period_end = datetime.fromtimestamp(stripe_sub['current_period_end'], tz=timezone.utc)
                await self.db.commit()

    async def check_entitlement(self, org_id: uuid.UUID, feature_key: str) -> bool:
        result = await self.db.execute(select(Subscription).where(Subscription.organization_id == org_id))
        subscription = result.scalar_one_or_none()
        
        if not subscription or subscription.status != 'active':
            # Check if Free plan exists and serves as fallback
            plan_query = await self.db.execute(select(Plan).where(Plan.name == 'Free'))
            plan = plan_query.scalar_one_or_none()
        else:
            plan_query = await self.db.execute(select(Plan).where(Plan.id == subscription.plan_id))
            plan = plan_query.scalar_one_or_none()
            
        if not plan:
            return False
            
        return bool(plan.features.get(feature_key, False))

    async def increment_usage(self, org_id: uuid.UUID, metric_name: str, count: int = 1) -> None:
        result = await self.db.execute(
            select(UsageRecord).where(
                UsageRecord.organization_id == org_id,
                UsageRecord.metric_name == metric_name
            )
        )
        usage = result.scalar_one_or_none()
        
        if usage:
            usage.count += count
        else:
            usage = UsageRecord(
                organization_id=org_id,
                metric_name=metric_name,
                count=count,
                reset_date=None
            )
            self.db.add(usage)
        await self.db.commit()
