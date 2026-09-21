import api from './api';
import { Comment, CreateCommentDto, UpdateCommentDto } from '@/types/comment.types';

export const commentService = {
  async getCommentsByAgreement(agreementId: string): Promise<Comment[]> {
    const response = await api.get<{ data: Comment[] }>(`/agreements/${agreementId}/comments`);
    return response.data.data;
  },

  async createComment(agreementId: string, data: CreateCommentDto): Promise<Comment> {
    const response = await api.post<{ data: Comment }>(`/agreements/${agreementId}/comments`, data);
    return response.data.data;
  },

  async updateComment(commentId: string, data: UpdateCommentDto): Promise<Comment> {
    const response = await api.patch<{ data: Comment }>(`/comments/${commentId}`, data);
    return response.data.data;
  }
};
