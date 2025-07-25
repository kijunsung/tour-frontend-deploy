import React, { ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, Typography, Button } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactNode;
  fallbackPath?: string;
  showLoginPrompt?: boolean;
  requiredRole?: string; // ?? 7/14
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallbackPath = '/',
  showLoginPrompt = true,
  requiredRole //7/14
}) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();
  
  if (!authContext) {
    throw new Error('ProtectedRoute must be used within an AuthProvider');
  }
  
  const { isAuthenticated, user} = authContext;

  // 로그인되지 않은 경우
  if (!isAuthenticated) {
    // 로그인 프롬프트를 보여줄지 결정
    if (showLoginPrompt) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          textAlign="center"
          px={3}
        >
          <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
            🔒 로그인이 필요합니다
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            이 페이지에 접근하려면 로그인해주세요.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.history.back()}
            sx={{ 
              backgroundColor: "#1976D2",
              "&:hover": {
                backgroundColor: "#1565C0"
              }
            }}
          >
            이전 페이지로 돌아가기
          </Button>
        </Box>
      );
    }

    // 단순 리다이렉트
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }
   // 로그인은 되었지만 requiredRole이 지정되어있고,
  // user가 없거나 역할이 맞지 않으면 접근 금지 처리
  if (requiredRole && (!user || user.role !== requiredRole)) {  // <-- 추가된 권한 체크 7/14
    // 권한이 맞지 않으면 메인 페이지 등으로 리다이렉트
    return <Navigate to="/" replace />;
  }

  // 로그인된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};

// 역방향 보호 라우트 (이미 로그인된 사용자가 로그인/회원가입 페이지 접근 방지)
interface PublicOnlyRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectPath = '/' 
}) => {
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('PublicOnlyRoute must be used within an AuthProvider');
  }
  
  const { isAuthenticated } = authContext;

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};