import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Alert
} from '@mui/material';
import { Edit as EditIcon, AccessTime as TimeIcon, Note as NoteIcon } from '@mui/icons-material';
import { ScheduleItemDto } from '../../../../../types/travel';

interface ScheduleEditModalProps {
  open: boolean;
  schedule: ScheduleItemDto | null;
  onClose: () => void;
  onSave: (scheduleId: string, updates: Partial<ScheduleItemDto>) => void;
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  open,
  schedule,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    memo: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 모달이 열릴 때 현재 스케줄 데이터로 초기화
  useEffect(() => {
    if (schedule && open) {
      setFormData({
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        memo: schedule.memo || ''
      });
      setErrors({});
    }
  }, [schedule, open]);

  // 시간 유효성 검사
  const validateTimes = (start: string, end: string): boolean => {
    if (!start || !end) {
      setErrors({ time: '시작 시간과 종료 시간을 모두 입력해주세요.' });
      return false;
    }

    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    if (startMinutes >= endMinutes) {
      setErrors({ time: '종료 시간은 시작 시간보다 늦어야 합니다.' });
      return false;
    }

    setErrors({});
    return true;
  };

  // HH:MM 형식을 분으로 변환
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 폼 데이터 변경 핸들러
  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 시간 필드 변경 시 실시간 유효성 검사
    if (field === 'startTime' || field === 'endTime') {
      const newFormData = { ...formData, [field]: value };
      if (newFormData.startTime && newFormData.endTime) {
        validateTimes(newFormData.startTime, newFormData.endTime);
      }
    }
  };

  // 저장 버튼 클릭 핸들러
  const handleSave = () => {
    if (!schedule?.scheduleId) return;

    // 최종 유효성 검사
    if (!validateTimes(formData.startTime, formData.endTime)) {
      return;
    }

    // 변경 사항 저장
    onSave(schedule.scheduleId, {
      startTime: formData.startTime,
      endTime: formData.endTime,
      memo: formData.memo.trim() || undefined // 빈 문자열은 undefined로 변환
    });

    onClose();
  };

  // 취소 버튼 클릭 핸들러
  const handleCancel = () => {
    setFormData({
      startTime: schedule?.startTime || '',
      endTime: schedule?.endTime || '',
      memo: schedule?.memo || ''
    });
    setErrors({});
    onClose();
  };

  if (!schedule) return null;

  // 교통편 여부 확인
  const isTransport = schedule.title.includes('🚇') || 
                      schedule.title.includes('🚌') || 
                      schedule.title.includes('🚗');

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" component="span">
            일정 수정
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* 일정 정보 표시 */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {schedule.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {schedule.content}
          </Typography>
          <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
            📅 {schedule.date} • {isTransport ? '🚇 교통편' : '📍 장소'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 시간 수정 섹션 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimeIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">
              시간 수정
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="시작 시간"
              type="time"
              value={formData.startTime}
              onChange={handleChange('startTime')}
              size="small"
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                step: 300, // 5분 단위
              }}
            />
            <Typography variant="body2" color="text.secondary">
              ~
            </Typography>
            <TextField
              label="종료 시간"
              type="time"
              value={formData.endTime}
              onChange={handleChange('endTime')}
              size="small"
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                step: 300, // 5분 단위
              }}
            />
          </Box>

          {/* 시간 오류 메시지 */}
          {errors.time && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {errors.time}
            </Alert>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 메모 작성 섹션 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NoteIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">
              메모 작성
            </Typography>
          </Box>
          
          <TextField
            label="개인 메모"
            multiline
            rows={3}
            value={formData.memo}
            onChange={handleChange('memo')}
            placeholder="이 일정에 대한 개인적인 메모나 참고사항을 작성해보세요..."
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            💡 예: 입장료, 주의사항, 준비물 등
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button 
          onClick={handleCancel} 
          variant="outlined"
          sx={{ minWidth: '80px' }}
        >
          취소
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!!errors.time}
          sx={{ minWidth: '80px' }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleEditModal;
