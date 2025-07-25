import axios from 'axios'; 
// axios 인스턴스를 불러옴. baseURL 설정되어 있음 (예: http://localhost:8080)

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 공통 API 응답 타입 (새로 추가된 부분)
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// 페이지네이션 타입 (새로 추가된 부분)
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export default api;
