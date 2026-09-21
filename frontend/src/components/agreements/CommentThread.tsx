import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare, CornerDownRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Comment, CommentStatus } from '@/types/comment.types';
import { useCreateComment, useUpdateComment } from '@/hooks/useComments';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';

interface CommentThreadProps {
  agreementId: string;
  comment: Comment;
}

const replySchema = z.object({
  content: z.string().min(1, 'Reply cannot be empty'),
});

type ReplyForm = z.infer<typeof replySchema>;

export function CommentThread({ agreementId, comment }: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: '' },
  });

  const handleReply = (data: ReplyForm) => {
    createComment.mutate({
      agreementId,
      data: { content: data.content, parent_id: comment.id },
    }, {
      onSuccess: () => {
        setIsReplying(false);
        reset();
      }
    });
  };

  const handleResolve = () => {
    updateComment.mutate({
      commentId: comment.id,
      data: { status: CommentStatus.RESOLVED },
    });
  };

  const handleReopen = () => {
    updateComment.mutate({
      commentId: comment.id,
      data: { status: CommentStatus.OPEN },
    });
  };

  const isResolved = comment.status === CommentStatus.RESOLVED;

  return (
    <div className={`p-4 rounded-lg border ${isResolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'} shadow-sm`}>
      {/* Top-level Comment */}
      <div className="flex gap-3">
        <Avatar name={comment.author_name} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-gray-900">{comment.author_name}</span>
              <span className="text-xs text-gray-500 ml-2">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <div>
              {isResolved ? (
                <Button variant="ghost" size="sm" onClick={handleReopen} leftIcon={<RotateCcw className="w-4 h-4" />}>
                  Reopen
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleResolve} leftIcon={<CheckCircle2 className="w-4 h-4 text-green-600" />}>
                  Resolve
                </Button>
              )}
            </div>
          </div>
          <p className={`mt-1 text-sm ${isResolved ? 'text-gray-500' : 'text-gray-800'}`}>
            {comment.content}
          </p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 pl-6 space-y-4 border-l-2 border-gray-100 ml-4">
          {comment.replies.map(reply => (
            <div key={reply.id} className="flex gap-3">
              <Avatar name={reply.author_name} />
              <div className="flex-1">
                <div>
                  <span className="font-medium text-sm text-gray-900">{reply.author_name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Action */}
      {!isResolved && (
        <div className="mt-4 pl-10">
          {!isReplying ? (
            <Button variant="ghost" size="sm" onClick={() => setIsReplying(true)} leftIcon={<CornerDownRight className="w-4 h-4" />}>
              Reply
            </Button>
          ) : (
            <form onSubmit={handleSubmit(handleReply)} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  {...register('content')}
                  placeholder="Type a reply..."
                  error={errors.content?.message}
                />
              </div>
              <Button type="submit" size="md" loading={createComment.isPending}>
                Send
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setIsReplying(false)}>
                Cancel
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
