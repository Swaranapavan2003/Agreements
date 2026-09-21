import api from './api';
import { Agreement, CreateAgreementDto, UpdateAgreementDto, AgreementStatus, AgreementParty } from '@/types/agreement.types';

const BASE_URL = '/api/v1/agreements';

export const agreementService = {
  list: async () => {
    return api.get<Agreement[]>(BASE_URL);
  },

  get: async (id: string) => {
    return api.get<Agreement>(`${BASE_URL}/${id}`);
  },

  create: async (data: CreateAgreementDto) => {
    return api.post<Agreement>(BASE_URL, data);
  },

  update: async (id: string, data: UpdateAgreementDto) => {
    return api.put<Agreement>(`${BASE_URL}/${id}`, data);
  },

  changeState: async (id: string, status: AgreementStatus) => {
    return api.post<Agreement>(`${BASE_URL}/${id}/status`, { status });
  },

  addParty: async (id: string, data: { name: string; email: string; role: string }) => {
    return api.post<AgreementParty>(`${BASE_URL}/${id}/parties`, data);
  },

  uploadVersion: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${BASE_URL}/${id}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
