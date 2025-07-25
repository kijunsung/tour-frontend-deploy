import React from 'react';
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { Login } from '../pages/Login/Login';
import { Signup } from '../pages/Signup/Signup';

interface AuthModalProps {
  openLogin: boolean;
  openSignup: boolean;
  onCloseLogin: () => void;
  onCloseSignup: () => void;
  onOpenSignup: () => void;
  onBackToLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  openLogin, 
  openSignup, 
  onCloseLogin, 
  onCloseSignup, 
  onOpenSignup, 
  onBackToLogin 
}) => {
  // 모달 스타일
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
  };

  return (
    <>
      {/* 로그인 모달 */}
      <Modal
        open={openLogin}
        onClose={onCloseLogin}
        aria-labelledby="login-modal-title"
      >
        <Box sx={modalStyle}>
          {/* 모달 헤더 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography id="login-modal-title" variant="h5" component="h2" fontWeight="bold">
              로그인
            </Typography>
            <IconButton onClick={onCloseLogin}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* 로그인 폼 */}
          <Login
            onSuccess={onCloseLogin}
            onSwitchToSignup={onOpenSignup}
          />
        </Box>
      </Modal>

      {/* 회원가입 모달 */}
      <Modal
        open={openSignup}
        onClose={onCloseSignup}
        aria-labelledby="signup-modal-title"
      >
        <Box sx={modalStyle}>
          {/* 모달 헤더 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography id="signup-modal-title" variant="h5" component="h2" fontWeight="bold">
              회원가입
            </Typography>
            <IconButton onClick={onCloseSignup}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* 회원가입 폼 */}
          <Signup
            onSuccess={onCloseSignup}
            onSwitchToLogin={onBackToLogin}
          />
        </Box>
      </Modal>
    </>
  );
};