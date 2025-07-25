import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import { getComments, postComment, updateComment, deleteComment } from '../../services/commentApi';
import { Comment, CommentRequest } from '../../types/comment';
import { AuthContext } from '../../context/AuthContext';

interface CommentsProps {
  threadId: number;
}

const Comments: React.FC<CommentsProps> = ({ threadId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const { user } = useContext(AuthContext);
  const isLoggedIn = !!user;

  const fetchComments = React.useCallback(async () => {
    try {
      const data = await getComments(threadId);
      setComments(data);
    } catch (error) {
      console.error('댓글 불러오기 실패:', error);
    }
  }, [threadId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const requestData: CommentRequest = {
      comment: newComment.trim(),
      threadId,
      userId: user.userId,
    };

    try {
      await postComment(requestData);
      await fetchComments();
      setNewComment('');
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      alert('댓글 등록에 실패했습니다.');
    }
  };

  const handleReplySubmit = async (parentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    const requestData: CommentRequest = {
      comment: replyContent.trim(),
      threadId,
      userId: user.userId, 
      parentId,
    };

    try {
      await postComment(requestData);
      await fetchComments();
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('대댓글 등록 실패:', error);
      alert('대댓글 등록에 실패했습니다.');
    }
  };

  const handleEdit = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingContent(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editingContent.trim() || !user) {
      alert('댓글 내용을 입력하세요.');
      return;
    }

    try {
      await updateComment(commentId, {
        comment: editingContent.trim(),
        threadId,
        userId: user.userId, // ✅ userId 추가
      });
      await fetchComments();
      setEditingCommentId(null);
      setEditingContent('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (commentId: number) => {
    const confirmed = window.confirm('이 댓글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      if (user) {
        await deleteComment(commentId, user.userId);
      } else {
        console.error('User is not logged in.');
      }
      await fetchComments();
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const renderComments = (commentList: Comment[], isChild = false) => {
    return commentList.map((comment) => (
      <Paper
  key={comment.commentId}
  elevation={isChild ? 1 : 2} // ✅ 대댓글은 그림자 얕게
  sx={{
    p: 2,
    mb: 2,
    borderRadius: 2,
    backgroundColor: isChild ? '#f9f9f9' : '#fff', // ✅ 대댓글 배경 연하게
    borderLeft: isChild ? '3px solid #1976d2' : 'none', // ✅ 계층 라인 추가
    ml: isChild ? 2 : 0, // ✅ 대댓글 들여쓰기
  }}
>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" color="primary">
            {comment.author}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(comment.createDate).toLocaleString()}
          </Typography>
        </Stack>

        {editingCommentId === comment.commentId ? (
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit(comment.commentId);
            }}
          >
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              placeholder="수정할 내용을 입력하세요"
              sx={{ mb: 1 }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="primary" type="submit">
                저장
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCancelEdit}
              >
                취소
              </Button>
            </Stack>
          </Box>
        ) : (
          <>
            <Typography
              variant="body1"
              sx={{ mb: 1, whiteSpace: 'pre-line' }} // ✅ 줄바꿈 유지
            >
              {comment.comment}
            </Typography>
            <Stack direction="row" spacing={1}>
              {isLoggedIn && !isChild && (
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  onClick={() => setReplyingTo(comment.commentId)}
                >
                  답글
                </Button>
              )}
              {user?.username === comment.author && (
                <>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() =>
                      handleEdit(comment.commentId, comment.comment)
                    }
                  >
                    수정
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={() => handleDelete(comment.commentId)}
                  >
                    삭제
                  </Button>
                </>
              )}
            </Stack>
          </>
        )}

        {replyingTo === comment.commentId && (
          <Box
            component="form"
            onSubmit={(e) => handleReplySubmit(comment.commentId, e)}
            mt={1}
          >
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요"
              sx={{ mb: 1 }}
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" color="primary">
                답글 등록
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                취소
              </Button>
            </Stack>
          </Box>
        )}

        {comment.comments && comment.comments.length > 0 && (
          <Box sx={{ pl: 3, mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            {renderComments(comment.comments, true)}
          </Box>
        )}
      </Paper>
    ));
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        댓글 ({comments.length})
      </Typography>

      <Box>{renderComments(comments)}</Box>

      {isLoggedIn ? (
        <Box
          component="form"
          onSubmit={handleSubmit}
        >
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" color="primary">
            댓글 작성
          </Button>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          로그인 후 댓글을 작성할 수 있습니다.
        </Typography>
      )}
    </Box>
  );
};

export default Comments;
