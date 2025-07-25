import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { signup } from '../../services/userApi';
import { SignupRequest } from '../../types/user'; // 올바른 타입 import

interface SignupProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

// 폼 데이터용 내부 타입 정의
interface SignupFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  phone: string;
}

export const Signup: React.FC<SignupProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phone: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      // SignupRequest 타입에 맞게 데이터 변환
      const signupRequest: SignupRequest = {
        username: formData.username, // username으로 email 사용
        password: formData.password,
        name: formData.name,
        email: formData.email,
        nickname: formData.nickname,
        phone: formData.phone || ''
      };

      const response = await signup(signupRequest);
      console.log("회원가입 성공:", response);
      
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        phone: ''
      });
      
      onSuccess?.();
      
      setTimeout(() => {
        onSwitchToLogin?.();
      }, 100);
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      setError(error.response?.data?.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
        value={formData.name}
        onChange={handleChange}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        name="username"
        label="아이디"
        type="username"
        variant="outlined"
        margin="normal"
        required
        value={formData.username}
        onChange={handleChange}
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
        value={formData.email}
        onChange={handleChange}
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
        value={formData.nickname}
        onChange={handleChange}
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
        value={formData.phone}
        onChange={handleChange}
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
        value={formData.password}
        onChange={handleChange}
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
        value={formData.confirmPassword}
        onChange={handleChange}
        sx={{ mb: 3 }}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ 
          mb: 2,
          backgroundColor: "#1976D2",
          "&:hover": {
            backgroundColor: "#1565C0"
          }
        }}
      >
        {loading ? "회원가입 중..." : "회원가입"}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          이미 계정이 있으신가요?{' '}
          <Button 
            variant="text" 
            size="small"
            sx={{ color: "#1976D2" }}
            onClick={onSwitchToLogin}
          >
            로그인
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};