export interface SignatureAudit {
  id: string
  agreement_id: string
  user_id: string
  signature_hash: string
  ip_address: string
  user_agent: string
  timestamp: string
  created_at: string
  updated_at: string
}

export interface SignAgreementPayload {
  agreement_id: string
  signature_hash: string
  ip_address: string
  user_agent: string
}
