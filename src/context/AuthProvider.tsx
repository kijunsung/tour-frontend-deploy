import { useState, useEffect, ReactNode } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';  
import { getToken, setToken, removeToken } from '../utils/token';

// 사용자 정보를 담을 타입
interface User {
  userId: number;
  username: string;
  role: 'USER' | 'ADMIN';
}

interface AuthProviderProps {
  children: ReactNode;
}

// localStorage 키 상수
const USER_KEY = 'user';

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<User | null>(null);

  // 로그인 함수: 토큰과 사용자 정보를 모두 저장
  const login = (newToken: string, newUser: User) => {
    // 토큰 저장
    setToken(newToken);
    setTokenState(newToken);
    
    // 사용자 정보도 localStorage에 저장
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  // 로그아웃 함수: 토큰과 사용자 정보 모두 삭제
  const logout = () => {
    removeToken();
    localStorage.removeItem(USER_KEY); // 사용자 정보도 삭제
    setTokenState(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  // 컴포넌트 마운트 시 localStorage에서 토큰과 사용자 정보 복원
  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      setTokenState(storedToken);
      
      // localStorage에서 사용자 정보도 복원
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('사용자 정보 복원 실패:', error);
          // 사용자 정보가 손상된 경우 로그아웃 처리
          logout();
        }
      }
    }
  }, []);
  // AuthContextType 에 맞춰서 value 제공
  const contextValue: AuthContextType = {
    token,
    user,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;