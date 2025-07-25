import React, { useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { TourType } from '../../types/travel';
import { useTravelStore } from '../../store/travelStore';
import { validateDateRange } from '../../utils/validate';

export const TravelInfo: React.FC = () => {
  const { currentTour, updateTourInfo, saveTourToBackend, error } = useTravelStore();
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 컴포넌트 마운트 시 기본 투어 정보 초기화
  useEffect(() => {
    if (!currentTour) {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      updateTourInfo({
        title: '',
        startDate: today,
        endDate: nextWeek,
        travelers: 2,
        budget: 'medium'
      });
    }
  }, [currentTour, updateTourInfo]);

  // 날짜 유효성 검증
  const validateDates = (startDate: string, endDate: string): string | null => {
    const result = validateDateRange(startDate, endDate);
    return result.isValid ? null : result.message || null;
  };

  // 전체 여행 정보 검증
  // const validateTourInfo = (): string | null => {
  //   if (!currentTour) return null;
  //   const result = validateTour(currentTour);
  //   return result.isValid ? null : result.message || null;
  // };

  const dateError = currentTour ? validateDates(currentTour.startDate, currentTour.endDate) : null;

  const handleInputChange = (field: keyof TourType, value: unknown) => {
    updateTourInfo({ [field]: value });
  };

  // 수동 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!currentTour) return;
    
    setSaveStatus('saving');
    try {
      const savedTour = await saveTourToBackend();
      if (savedTour) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('여행 정보 저장 실패:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [currentTour, saveTourToBackend]);

  if (!currentTour) {
    return null; // 로딩 상태
  }

  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🎯 여행 정보
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={
            saveStatus === 'saving' ? <CircularProgress size={16} color="inherit" /> : <Save />
          }
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !currentTour}
          color={saveStatus === 'saved' ? 'success' : 'primary'}
        >
          {saveStatus === 'saving' ? '저장 중...' : 
           saveStatus === 'saved' ? '저장됨' : '저장'}
        </Button>
      </Box>
      
      {/* 상태 메시지 */}
      {saveStatus === 'saved' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          여행 정보가 성공적으로 저장되었습니다.
        </Alert>
      )}
      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          저장 중 오류가 발생했습니다. 다시 시도해주세요.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TextField
        fullWidth
        label="여행 제목"
        placeholder="예: 김철수의 서울 여행"
        value={currentTour.title}
        onChange={(e) => handleInputChange('title', e.target.value)}
        margin="normal"
        size="small"
        helperText="여행 제목을 입력해주세요"
      />
      
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <TextField
          type="date"
          label="시작일"
          value={currentTour.startDate}
          onChange={(e) => handleInputChange('startDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
          size="small"
          error={!!dateError}
        />
        <TextField
          type="date"
          label="종료일"
          value={currentTour.endDate}
          onChange={(e) => handleInputChange('endDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
          size="small"
          error={!!dateError}
        />
      </Box>
      
      {dateError && (
        <Alert severity="error" sx={{ mt: 1, py: 0 }}>
          {dateError}
        </Alert>
      )}
      
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>여행자 수</InputLabel>
        <Select
          value={currentTour.travelers}
          label="여행자 수"
          onChange={(e) => handleInputChange('travelers', Number(e.target.value))}
        >
          <MenuItem value={1}>1명 (혼자)</MenuItem>
          <MenuItem value={2}>2명 (커플/친구)</MenuItem>
          <MenuItem value={3}>3명</MenuItem>
          <MenuItem value={4}>4명 (가족)</MenuItem>
          <MenuItem value={5}>5명 이상</MenuItem>
        </Select>
      </FormControl>
      
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>예상 예산</InputLabel>
        <Select
          value={currentTour.budget}
          label="예상 예산"
          onChange={(e) => handleInputChange('budget', e.target.value)}
        >
          <MenuItem value="low">50만원 이하</MenuItem>
          <MenuItem value="medium">50-100만원</MenuItem>
          <MenuItem value="high">100-200만원</MenuItem>
          <MenuItem value="luxury">200만원 이상</MenuItem>
        </Select>
      </FormControl>

      {/* 여행 기간 표시 */}
      {currentTour.startDate && currentTour.endDate && !dateError && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            📅 여행 기간: {Math.ceil((new Date(currentTour.endDate).getTime() - new Date(currentTour.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일
          </Typography>
          <Typography variant="body2" color="text.secondary">
            👥 총 {currentTour.travelers}명
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TravelInfo;