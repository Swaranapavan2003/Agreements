export enum AgreementStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  SIGNED = 'SIGNED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED'
}

export enum RenewalType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  NONE = 'NONE'
}

export interface AgreementParty {
  id: string;
  agreement_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AgreementVersion {
  id: string;
  agreement_id: string;
  version_number: number;
  s3_key: string;
  file_name: string;
  created_at: string;
}

export interface Agreement {
  id: string;
  organization_id: string;
  title: string;
  status: AgreementStatus;
  effective_date: string | null;
  expiry_date: string | null;
  renewal_type: RenewalType;
  created_at: string;
  updated_at: string;
  parties?: AgreementParty[];
  versions?: AgreementVersion[];
}

export interface CreateAgreementDto {
  title: string;
  effective_date?: string;
  expiry_date?: string;
  renewal_type?: RenewalType;
}

export interface UpdateAgreementDto extends Partial<CreateAgreementDto> {}
