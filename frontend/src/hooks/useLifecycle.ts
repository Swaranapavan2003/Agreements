import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lifecycleService } from '@/services/lifecycle.service'

export const useLifecycle = () => {
  const queryClient = useQueryClient()

  const invalidate = (agreementId: string) => {
    queryClient.invalidateQueries({ queryKey: ['agreements', agreementId] })
    queryClient.invalidateQueries({ queryKey: ['agreements'] })
  }

  const renewAgreement = useMutation({
    mutationFn: async ({ agreementId, newEndDate }: { agreementId: string; newEndDate?: string }) => {
      const res = await lifecycleService.renewAgreement(agreementId, newEndDate)
      return res.data.data
    },
    onSuccess: (_, { agreementId }) => invalidate(agreementId),
  })

  const amendAgreement = useMutation({
    mutationFn: async ({ agreementId, details }: { agreementId: string; details: string }) => {
      const res = await lifecycleService.amendAgreement(agreementId, details)
      return res.data.data
    },
    onSuccess: (_, { agreementId }) => invalidate(agreementId),
  })

  const terminateAgreement = useMutation({
    mutationFn: async ({ agreementId, reason }: { agreementId: string; reason: string }) => {
      const res = await lifecycleService.terminateAgreement(agreementId, reason)
      return res.data.data
    },
    onSuccess: (_, { agreementId }) => invalidate(agreementId),
  })

  return {
    renewAgreement,
    amendAgreement,
    terminateAgreement,
  }
}
