export interface Comment {
  commentId: number;         // 댓글 고유 ID (백엔드 기준으로 필드명이 commentId)
  threadId: number;          // 어떤 게시글(thread)에 속한 댓글인지
  author: string;            // 작성자 이름 (문자열)
  comment: string;           // 댓글 내용
  createDate: string;        // 생성일 (ISO 문자열로 전달됨)
  modifiedDate: string;      // 수정일 (수정된 경우)
  parentId?: number;        // 대댓글이면 부모 댓글 ID 7/2
  comments?: Comment[];     // 대댓글 리스트 (트리 구조)
  userId: number;
}
// 댓글 작성 요청용 (POST 요청 body에 사용)
export interface CommentRequest {
  threadId: number;
  comment: string;           
  parentId?: number;   
  userId: number;      // 대댓글 등록 시 필요한 필드 7/2
}