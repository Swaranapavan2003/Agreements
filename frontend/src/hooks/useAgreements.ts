import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementService } from '@/services/agreement.service';
import { CreateAgreementDto, UpdateAgreementDto, AgreementStatus } from '@/types/agreement.types';
import toast from 'react-hot-toast';

export const useAgreements = () => {
  return useQuery({
    queryKey: ['agreements'],
    queryFn: async () => {
      const { data } = await agreementService.list();
      return data;
    },
  });
};

export const useAgreement = (id: string) => {
  return useQuery({
    queryKey: ['agreement', id],
    queryFn: async () => {
      const { data } = await agreementService.get(id);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateAgreement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgreementDto) => agreementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    },
    onError: () => {
      toast.error('Failed to create agreement');
    },
  });
};

export const useUpdateAgreement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgreementDto }) => agreementService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement', variables.id] });
      toast.success('Agreement updated successfully');
    },
    onError: () => {
      toast.error('Failed to update agreement');
    },
  });
};

export const useChangeAgreementStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgreementStatus }) => agreementService.changeState(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement', variables.id] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });
};

export const useAddAgreementParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; email: string; role: string } }) => agreementService.addParty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreement', variables.id] });
      toast.success('Party added successfully');
    },
    onError: () => {
      toast.error('Failed to add party');
    },
  });
};

export const useUploadAgreementVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => agreementService.uploadVersion(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreement', variables.id] });
      toast.success('Document uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload document');
    },
  });
};
