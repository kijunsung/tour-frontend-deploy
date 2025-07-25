import { createContext } from 'react';


// 로그인한 사용자 정보를 담을 User 타입 정의
export interface User {
  userId: number;      // 사용자 고유 ID
  username: string;    // 사용자 이름 (닉네임 등)
  role: 'USER' | 'ADMIN'; 
  // 필요에 따라 이메일 등 추가 가능
}

// AuthContext가 제공할 타입 정의
export interface AuthContextType {
  token: string | null;          // 현재 로그인 토큰 (없으면 null)
  user: User | null;                   // 로그인한 사용자 정보 (없으면 null)
  login: (token: string,  user: User) => void;  // 로그인 처리 함수 (토큰 저장 및 상태 변경)
  logout: () => void;              // 로그아웃 처리 함수 (토큰 삭제 및 상태 변경)
  isAuthenticated: boolean;        // 로그인 여부 boolean
}

// 기본값 빈 상태 (초기값)
// 실제 Context 사용 시 이 값은 거의 쓰이지 않지만, 타입 안전성을 위해 설정
const defaultAuthContext: AuthContextType = {
  token: null,            // 기본은 로그인되지 않은 상태
  user: null,             // 사용자 정보도 없음
  login: () => {},        // 기본 login 함수는 빈 함수 (실제 구현은 Provider에서)
  logout: () => {},       // 기본 logout 함수도 빈 함수
  isAuthenticated: false,  // 기본 로그인 상태는 false
};

// Context 생성
// React 컴포넌트 트리에서 전역적으로 인증 정보를 전달할 수 있는 Context 생성
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);
// 다른 파일에서 import 할 때 `import AuthContext from ...` 으로 불러올 수 있게 함
export default AuthContext;





