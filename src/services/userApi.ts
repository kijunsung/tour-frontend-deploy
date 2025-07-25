// axios 인스턴스를 불러옴. baseURL 설정되어 있음 (예: http://localhost:8080)
import api from './api';
import {  UserUpdateRequest, LoginRequest, SignupRequest, UserResponse, JwtResponse, User } from '../types/user';
import { Thread } from '../types/thread'; // 타입도 경로 맞게!
// .d.ts는 타입만 정의하는 파일임을 나타내는 확장자.여기 user는 파일명에서 .d.ts 확장자를 빼고 쓴거


// ✅ [로그인 요청] : 사용자가 입력한 username, password를 백엔드로 보냄
export const login = async (data: LoginRequest): Promise<JwtResponse> => {
  // POST 방식으로 /api/users/login에 로그인 데이터 전송
  const response = await api.post('/users/login', data);

  // 응답에서 토큰(JwtResponse)을 추출하여 반환
  return response.data;
};


// ✅ [회원가입 요청] : 회원가입 폼에서 입력한 유저 정보들을 전송
export const signup = async (data: SignupRequest): Promise<UserResponse> => {
  // POST 방식으로 /api/users/register에 회원가입 정보 전송
  const response = await api.post('/users/register', data);

  // 응답으로 생성된 사용자 정보 반환
  return response.data;
};


// ✅ [마이페이지 - 유저 정보 조회] : 로그인된 사용자의 userId로 정보 조회
export const getUserProfile = async (userId: number): Promise<UserResponse> => {
  // GET 방식으로 /api/users/{userId} 호출
  const response = await api.get(`/users/${userId}`);

  // 백엔드로부터 받은 사용자 정보 반환
  return response.data;
};
// 회원정보 수정 API 함수
export const updateUserProfile = async (
  userId: number,
  data: UserUpdateRequest
): Promise<UserResponse> => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

// 로그아웃은 API 요청이 없어도 되는 경우 많음 
// 웹 앱에서 로그아웃은 클라이언트에서 토큰을 삭제하는 것만으로 충분
// 토큰 삭제하면 인증요청할 필요가 없으니까

export const getUserIdByUsername = async (username: string): Promise<number> => {
  const response = await api.get(`/users/username/${username}`);
  return response.data;  // userId 반환
};

/** 모든 게시글 목록 조회 */
export const getUserss = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export async function getLikedThreads(userId: number): Promise<Thread[]> {
  const res = await api.get(`/users/${userId}/liked-threads`);
  return res.data;
}

export const getMyThreads = async (userId: number): Promise<Thread[]> => {
  const response = await api.get(`/users/${userId}/threads`);
  return response.data;
};

