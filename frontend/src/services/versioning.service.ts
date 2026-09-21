import api from './api';

export interface CompareVersionsResponse {
  version_id_1: string;
  version_id_2: string;
  diff_text: string;
  ai_summary?: string;
}

export const versioningService = {
  async compareVersions(agreementId: string, versionId1: string, versionId2: string): Promise<CompareVersionsResponse> {
    const response = await api.get<{ data: CompareVersionsResponse }>(`/versions/compare`, {
      params: { agreement_id: agreementId, version_1: versionId1, version_2: versionId2 }
    });
    return response.data.data;
  }
};
