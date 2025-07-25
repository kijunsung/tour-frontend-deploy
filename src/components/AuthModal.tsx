import { Modal, Box, Typography, TextField, Button, IconButton } from "@mui/material";
import axios from "axios";
import Alert from "@mui/material/Alert";
import { Close as CloseIcon } from "@mui/icons-material";
import { useState } from "react";

interface AuthModalProps {
  openLogin: boolean;
  openSignup: boolean;
  onCloseLogin: () => void;
  onCloseSignup: () => void;
  onOpenSignup: () => void;
  onBackToLogin: () => void;
}

export default function AuthModal({ 
  openLogin, 
  openSignup, 
  onCloseLogin, 
  onCloseSignup, 
  onOpenSignup, 
  onBackToLogin 
}: AuthModalProps) {
  // 폼 데이터 상태 관리
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: ''
  });

  // 에러 및 로딩 상태
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // 입력값 변경 핸들러
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    setLoginError(''); // 에러 메시지 초기화
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
    setSignupError(''); // 에러 메시지 초기화
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
  
    try {
      const response = await axios.post('http://localhost:8080/api/users/login', {
        username: loginData.username,
        password: loginData.password
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10초 타임아웃
      });
  
      alert("로그인 되었습니다.");
      console.log("로그인 성공:", response.data);
      localStorage.setItem('token', response.data.token);
      onCloseLogin(); // 이 함수에서 Header의 로그인 상태가 업데이트됨
      setLoginData({ username: '', password: '' });
    } catch (error: any) {
      console.error("로그인 실패:", error);
      if (error.code === 'ERR_NETWORK') {
        setLoginError("서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.");
      } else {
        setLoginError(error.response?.data?.message || "로그인에 실패했습니다.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError("비밀번호가 일치하지 않습니다.");
      setSignupLoading(false);
      return;
    }

    try {
      const newUser = {
        username: signupData.username,
        password: signupData.password,
        name: signupData.name,
        email: signupData.email,
        nickname: signupData.nickname,
        phone: signupData.phone || '', // 전화번호는 선택 사항이므로 기본값 설정
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await axios.post('http://localhost:8080/api/users/register', newUser, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log("회원가입 성공:", response.data);
      onCloseSignup();
      setSignupData({ name: '', username: '', email: '', password: '', confirmPassword: '' , nickname: '', phone: '' });
      
      setTimeout(() => {
        onBackToLogin();
      }, 100);
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      if (error.code === 'ERR_NETWORK') {
        setSignupError("서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.");
      } else {
        setSignupError(error.response?.data?.message || "회원가입에 실패했습니다.");
      }
    } finally {
      setSignupLoading(false);
    }
  };

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
          <Box component="form" onSubmit={handleLogin}>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}
            
            <TextField
              fullWidth
              name="username"
              label="아이디"
              type="username"
              variant="outlined"
              margin="normal"
              required
              value={loginData.username}
              onChange={handleLoginChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              variant="outlined"
              margin="normal"
              required
              value={loginData.password}
              onChange={handleLoginChange}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loginLoading}
              sx={{ 
                mb: 2,
                backgroundColor: "#1976D2",
                "&:hover": {
                  backgroundColor: "#1565C0"
                }
              }}
            >
              {loginLoading ? "로그인 중..." : "로그인"}
            </Button>

            {/* 추가 옵션들 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                계정이 없으신가요?{' '}
                <Button 
                  variant="text" 
                  size="small"
                  sx={{ color: "#1976D2" }}
                  onClick={onOpenSignup}
                >
                  회원가입
                </Button>
              </Typography>
            </Box>
          </Box>
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
          <Box component="form" onSubmit={handleSignup}>
            {signupError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {signupError}
              </Alert>
            )}
            
            <TextField
              fullWidth
              name="name"
              label="이름"
              type="text"
              variant="outlined"
              margin="normal"
              required
              value={signupData.name}
              onChange={handleSignupChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="email"
              label="이메일"
              type="email"
              variant="outlined"
              margin="normal"
              required
              value={signupData.email}
              onChange={handleSignupChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="nickname"
              label="닉네임"
              type="text"
              variant="outlined"
              margin="normal"
              required
              value={signupData.nickname}
              onChange={handleSignupChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="phone"
              label="전화번호"
              type="tel"
              variant="outlined"
              margin="normal"
              required
              value={signupData.phone}
              onChange={handleSignupChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              variant="outlined"
              margin="normal"
              required
              value={signupData.password}
              onChange={handleSignupChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              name="confirmPassword"
              label="비밀번호 확인"
              type="password"
              variant="outlined"
              margin="normal"
              required
              value={signupData.confirmPassword}
              onChange={handleSignupChange}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={signupLoading}
              sx={{ 
                mb: 2,
                backgroundColor: "#1976D2",
                "&:hover": {
                  backgroundColor: "#1565C0"
                }
              }}
            >
              {signupLoading ? "회원가입 중..." : "회원가입"}
            </Button>

            {/* 추가 옵션들 */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                이미 계정이 있으신가요?{' '}
                <Button 
                  variant="text" 
                  size="small"
                  sx={{ color: "#1976D2" }}
                  onClick={onBackToLogin}
                >
                  로그인
                </Button>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}