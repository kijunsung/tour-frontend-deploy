

export interface Thread { // thread dto 데이터구조와 일치
  threadId: number;         // 게시글 ID (PK)
  userId: number;           // 작성자 ID
  title: string;            // 제목
  content: string;          // 본문
  author: string;           // 작성자 이름
  count: number;            // 조회수
  heart: number;            // 좋아요 수
  filePaths?: string[];      // ✅ 여러 파일 경로 배열
  commentCount: number;     // 댓글 수
  likedByCurrentUser: boolean; //7/2
  area?: string;             // 지역명
  createDate: string;       // 작성일 (ISO 8601)
  modifiedDate: string;     // 수정일
}

export interface ThreadRequest { // 게시글 "작성 시" 보내는 데이터 구조. 백엔드 Thread 컨트롤러에서 받음
  userId: number;
  title: string;
  content: string;
  author: string;
  filePaths?: string[];      // ✅ 여러 파일 경로 배열
  area?: string;
}
