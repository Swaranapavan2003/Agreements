export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  features: string[];
}

export interface Subscription {
  id: string;
  planId: string;
  planTier: PlanTier;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageRecord {
  agreementsCount: number;
  agreementsLimit: number;
  aiQueriesCount: number;
  aiQueriesLimit: number;
}
