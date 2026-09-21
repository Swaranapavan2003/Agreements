import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubscription, createCheckoutSession } from '../services/billing.service';
import type { PlanTier } from '../types/billing.types';
import toast from 'react-hot-toast';

export const useSubscription = () => {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: getSubscription,
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (planTier: PlanTier) => createCheckoutSession(planTier),
    onSuccess: (data) => {
      // Redirect to Stripe checkout URL
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start checkout process');
    }
  });
};
