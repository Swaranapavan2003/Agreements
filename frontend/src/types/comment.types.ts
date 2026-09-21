export enum CommentStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED'
}

export interface Comment {
  id: string;
  agreement_id: string;
  author_id: string;
  author_name: string;
  content: string;
  status: CommentStatus;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface CreateCommentDto {
  content: string;
  parent_id?: string;
}

export interface UpdateCommentDto {
  status?: CommentStatus;
  content?: string;
}
