import React, { useState, useContext } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { login } from '../../services/userApi';
import { LoginRequest, User } from '../../types/user';
import { AuthContext } from '../../context/AuthContext';

interface LoginProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToSignup }) => {
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('Login must be used within an AuthProvider');
  }
  
  const { login: authLogin } = authContext;
  
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
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

    try {
      const response = await login({
        username: formData.username,
        password: formData.password
      });

      alert("로그인 되었습니다.");
      console.log("로그인 성공:", response);
      
      const user: User = {
        userId: response.userId,
        username: response.username,
        role: response.role === 'ADMIN' ? 'ADMIN' : 'USER',
        name: '',
        email: '',
        createDate: ''
      };
      authLogin(response.token, user);
      setFormData({ username: '', password: '' });
      onSuccess?.();
    } catch (error: unknown) {
      console.error("로그인 실패:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred.');
      }
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
        name="password"
        label="비밀번호"
        type="password"
        variant="outlined"
        margin="normal"
        required
        value={formData.password}
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
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          계정이 없으신가요?{' '}
          <Button 
            variant="text" 
            size="small"
            sx={{ color: "#1976D2" }}
            onClick={onSwitchToSignup}
          >
            회원가입
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};