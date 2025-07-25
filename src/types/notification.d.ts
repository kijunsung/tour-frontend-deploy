

export interface Notification {
  noticeId: number;
  userId: number;
  threadId: number;
  commentId: number;
  message: string;
  isRead: boolean;
  createDate: string;
}
