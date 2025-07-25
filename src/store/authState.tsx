// 인증 상태를 가져오기 위해 React의 useContext 훅 사용
import { useContext } from "react";

// 리디렉션(페이지 이동)을 위한 Navigate 컴포넌트 import
import { Navigate } from "react-router-dom";

// 우리가 만든 인증 상태 AuthContext 불러옴
import { AuthContext } from "../context/AuthContext";

// 컴포넌트에 전달될 props 타입 정의
// children: 보호하고 싶은 페이지 컴포넌트가 들어옴
interface ProtectedRouteProps {
  children: JSX.Element;
}

// ProtectedRoute 컴포넌트 정의
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Context를 통해 로그인 상태를 가져옴
  const { isAuthenticated } = useContext(AuthContext);

  // 로그인하지 않았다면 로그인 페이지로 리디렉션
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
    // replace: 히스토리에 로그인 전 페이지를 남기지 않음 (뒤로 가기 방지)
  }

  // 로그인 상태면 보호된 컴포넌트를 보여줌
  return children;
};

export default ProtectedRoute;
