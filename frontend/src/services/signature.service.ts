import { APIResponse } from '@/types/common.types'
import { SignatureAudit, SignAgreementPayload } from '@/types/signature.types'
import api from './api'

export const signatureService = {
  getSignatures: (agreementId: string) => 
    api.get<APIResponse<SignatureAudit[]>>(`/agreements/${agreementId}/signatures`),

  signAgreement: (data: SignAgreementPayload) => 
    api.post<APIResponse<SignatureAudit>>(`/agreements/${data.agreement_id}/sign`, data),
}
