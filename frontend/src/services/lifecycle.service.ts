import { APIResponse } from '@/types/common.types'
import { Agreement } from '@/types/agreement.types'
import api from './api'

export const lifecycleService = {
  renewAgreement: (agreementId: string, newEndDate?: string) => 
    api.post<APIResponse<Agreement>>(`/agreements/${agreementId}/lifecycle/renew`, { newEndDate }),

  amendAgreement: (agreementId: string, details: string) => 
    api.post<APIResponse<Agreement>>(`/agreements/${agreementId}/lifecycle/amend`, { details }),

  terminateAgreement: (agreementId: string, reason: string) => 
    api.post<APIResponse<Agreement>>(`/agreements/${agreementId}/lifecycle/terminate`, { reason }),
}
