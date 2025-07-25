import api from './api';
import { Thread, ThreadRequest } from '../types/thread';

/** 모든 게시글 목록 조회 */
export const getThreads = async (): Promise<Thread[]> => {
  const response = await api.get('/thread');
  return response.data;
};

/** 게시글 작성 */
export const createThread = async (thread: ThreadRequest): Promise<Thread> => {
  const response = await api.post('/thread', thread);
  return response.data;
};

/** 파일 업로드 */
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  // ApiResponse<string> 대신 string 타입으로 받기
  const response = await api.post<string>('/thread/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data; // 파일 URL이 바로 data에 있음
};


/** 게시글 상세 조회 (Id로 조회하는거임) */
// export const getThreadById = async (threadId: number): Promise<Thread> => {
//   const response = await api.get(`/thread/${threadId}`);
//   return response.data;
// };

/** 게시글 삭제 */
export const deleteThread = async (threadId: number): Promise<void> => {
  await api.delete(`/thread/${threadId}`);
};

/** 게시글 수정 */
export const updateThread = async (threadId: number, thread: ThreadRequest): Promise<Thread> => {
  const response = await api.put(`/thread/${threadId}`, thread);
  return response.data;
};

/** 좋아요 기능 (게시글 좋아요 수 증가 등 처리) */
// export const likeThread = async (threadId: number): Promise<Thread> => {
//   const response = await api.post(`/thread/${threadId}/like`);
//   return response.data;
// };
/** 게시글 검색 기능 (제목+내용 or 작성자 기준) */
export const searchThreads = async (keyword: string, 
searchType: 'author' | 'title_content', sortBy: 'createDate' | 'views' | 'likes' = 'createDate'
): Promise<Thread[]> => {
  const response = await api.get(`/thread/search`, {
    params: {
      keyword, 
      searchType,
      sortBy,
    },
  });
  return response.data;
};

/** 좋아요 기능 (게시글 좋아요 수 증가 등 처리) */
export const likeThread = async (threadId: number, userId: number) => {
  const response = await api.post(`/thread/${threadId}/like`, null, {
    params: { userId },
  });
  return response.data;
};

/** 게시글 상세 조회 + 좋아요 상태 포함 조회 (userId 필요) */
export const getThreadWithLikeStatus = async (threadId: number, userId: number): Promise<Thread> => {
  const response = await api.get(`/thread/${threadId}/like-status`, {
    params: { userId },
  });
  return response.data;
};

export const getUserThreads = async (userId: number): Promise<Thread[]> => {
  const response = await api.get(`/thread/user/${userId}/threads`);
  return response.data;
};