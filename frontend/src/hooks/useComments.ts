import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '@/services/comment.service';
import { CreateCommentDto, UpdateCommentDto } from '@/types/comment.types';

export function useComments(agreementId: string) {
  return useQuery({
    queryKey: ['comments', agreementId],
    queryFn: () => commentService.getCommentsByAgreement(agreementId),
    enabled: !!agreementId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agreementId, data }: { agreementId: string; data: CreateCommentDto }) =>
      commentService.createComment(agreementId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.agreementId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentDto }) =>
      commentService.updateComment(commentId, data),
    onSuccess: () => {
      // Typically we'd invalidate or optimistically update. 
      // For simplicity, let's invalidate all comments to refresh the list.
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
