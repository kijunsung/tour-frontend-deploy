
// 로그인 요청
export interface LoginRequest {
  username: string;
  password: string;
}
// 로그인 응답 (토큰 포함)
export interface JwtResponse {
  role: string;
  token: string;
  userId: number;
  username: string;
}
// 회원가입 요청 시 사용할 타입
export interface SignupRequest {  //UserRequestDto에 맞춰서 필요한 필드만 담음
  username: string;
  password: string;
  email: string;
  name: string;
  phone: string;
  nickname: string;
}
// 사용자 정보 응답 (마이페이지 등)
export interface UserResponse {
  userId: number;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  nickname: string;
  createDate: string;
  modifiedDate: string;
}
// 회원정보 수정 요청 타입 - 백엔드 DTo 에 없어서 새로 만듬 // 비번 변경 중복체크는 아직 안함 정보수정만 가능 
export interface UserUpdateRequest {
  username: string;
  password: string;
  email: string;
  name?: string;
  phone?: string;
  nickname?: string;
}


interface User {
  userId: number;           // 고유 ID
  username: string;     // 아이디..
  name: string;         // 유저 이름
  email: string;        // 이메일
  role: 'USER' | 'ADMIN';   // Role enum 문자열 처리
  createDate: string;   // 가입일
}
