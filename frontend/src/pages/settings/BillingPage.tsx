import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSubscription, useCheckout } from '@/hooks/useBilling';
import { Check, Loader2 } from 'lucide-react';
import type { PlanTier } from '@/types/billing.types';
import { cn } from '@/utils/cn';

const PLANS = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    description: 'For individuals and small teams starting out.',
    features: ['Up to 10 agreements', '50 AI queries/month', 'Basic templates', 'Email support'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'For growing teams that need more power.',
    features: ['Unlimited agreements', '500 AI queries/month', 'Advanced templates', 'Priority support', 'Custom branding'],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with complex needs.',
    features: ['Unlimited everything', 'Dedicated success manager', 'SSO & advanced security', 'Custom integrations', '24/7 phone support'],
  }
];

export function BillingPage() {
  const { data, isLoading } = useSubscription();
  const checkout = useCheckout();
  
  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }
  
  const subscription = data?.subscription;
  const usage = data?.usage;
  const currentTier = subscription?.planTier || 'free';
  
  const handleUpgrade = (tier: PlanTier) => {
    checkout.mutate(tier);
  };
  
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Billing & Usage</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your subscription and monitor your usage limits.</p>
      </div>
      
      {/* Current Plan & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Current Plan</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900 capitalize">{currentTier}</span>
                {subscription?.status === 'active' && <Badge variant="success">Active</Badge>}
              </div>
              {subscription?.currentPeriodEnd && (
                <p className="mt-4 text-sm text-gray-500">
                  Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </Card>
        
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Usage</h2>
          {usage ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Agreements Created</span>
                  <span className="text-gray-500">{usage.agreementsCount} / {usage.agreementsLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (usage.agreementsCount / usage.agreementsLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">AI Queries</span>
                  <span className="text-gray-500">{usage.aiQueriesCount} / {usage.aiQueriesLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (usage.aiQueriesCount / usage.aiQueriesLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Usage data unavailable.</p>
          )}
        </Card>
      </div>

      {/* Pricing Table */}
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-6">Upgrade your plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            return (
              <Card key={plan.tier} className={cn('relative', isCurrent && 'ring-2 ring-indigo-600')}>
                {isCurrent && (
                  <div className="absolute top-0 right-6 transform -translate-y-1/2">
                    <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">Current Plan</span>
                  </div>
                )}
                <div className="p-2">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-500 min-h-[40px]">{plan.description}</p>
                  <p className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-500">/month</span>}
                  </p>
                  
                  <Button 
                    className="w-full mt-6" 
                    variant={isCurrent ? 'outline' : 'primary'}
                    disabled={isCurrent || plan.tier === 'enterprise' || checkout.isPending}
                    loading={checkout.isPending && checkout.variables === plan.tier}
                    onClick={() => handleUpgrade(plan.tier as PlanTier)}
                  >
                    {isCurrent ? 'Current Plan' : plan.tier === 'enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                  </Button>
                  
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-indigo-500 shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
}
