import { useQuery } from '@tanstack/react-query';
import { versioningService } from '@/services/versioning.service';

export function useCompareVersions(agreementId: string, versionId1: string | null, versionId2: string | null) {
  return useQuery({
    queryKey: ['versionCompare', agreementId, versionId1, versionId2],
    queryFn: () => versioningService.compareVersions(agreementId, versionId1!, versionId2!),
    enabled: !!agreementId && !!versionId1 && !!versionId2,
  });
}
