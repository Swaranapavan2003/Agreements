import api from './api';
import type { Plan, Subscription, UsageRecord, PlanTier } from '../types/billing.types';

export const getSubscription = async (): Promise<{ subscription: Subscription | null; usage: UsageRecord }> => {
  const { data } = await api.get('/billing/subscription');
  return data.data; // assuming API standard response wrapper `{ success: true, data: { subscription, usage } }`
};

export const createCheckoutSession = async (planTier: PlanTier): Promise<{ url: string }> => {
  const { data } = await api.post('/billing/checkout', { planTier });
  return data.data;
};
