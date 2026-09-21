import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signatureService } from '@/services/signature.service'
import { SignAgreementPayload } from '@/types/signature.types'

export const useSignatures = (agreementId: string) => {
  return useQuery({
    queryKey: ['agreements', agreementId, 'signatures'],
    queryFn: async () => {
      const res = await signatureService.getSignatures(agreementId)
      return res.data.data
    },
    enabled: !!agreementId,
  })
}

export const useSignAgreement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SignAgreementPayload) => {
      const res = await signatureService.signAgreement(data)
      return res.data.data
    },
    onSuccess: (_, { agreement_id }) => {
      queryClient.invalidateQueries({ queryKey: ['agreements', agreement_id, 'signatures'] })
      queryClient.invalidateQueries({ queryKey: ['agreements', agreement_id] })
    },
  })
}
