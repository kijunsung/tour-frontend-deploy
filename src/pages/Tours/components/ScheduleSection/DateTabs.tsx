import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTravelState, useTravelActions } from '../../../../store/travelStore';

const DateTabs: React.FC = () => {
  const { availableDates, selectedDate, currentTour } = useTravelState();
  const { addNextDate, setSelectedDate } = useTravelActions();

  // 날짜를 M/D 형태로 포맷
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 더 이상 날짜를 추가할 수 있는지 확인
  const canAddMoreDates = (): boolean => {
    if (!currentTour?.endDate || availableDates.length === 0) {
      return true; // 첫 번째 날짜이거나 종료일이 설정되지 않은 경우
    }
    
    const lastAvailableDate = availableDates[availableDates.length - 1];
    const endDate = currentTour.endDate;
    
    return lastAvailableDate < endDate;
  };

  // 날짜 탭 클릭 핸들러
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  // 일정 추가 버튼 클릭 핸들러
  const handleAddDate = () => {
    if (canAddMoreDates()) {
      addNextDate();
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* 헤더 */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📅 일정 관리
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddDate}
          disabled={!canAddMoreDates()}
          sx={{ borderRadius: '20px' }}
        >
          장소 추가
        </Button>
      </Box>

      {/* 날짜 탭들 */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 0.5, 
          mb: 2,
          overflowX: 'auto',
          pb: 1
        }}
      >
        {availableDates.map((date) => (
          <Button
            key={date}
            variant={selectedDate === date ? 'contained' : 'outlined'}
            onClick={() => handleDateClick(date)}
            sx={{
              minWidth: '80px',
              height: '40px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: selectedDate === date ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: selectedDate === date 
                  ? 'primary.dark' 
                  : 'primary.light',
                color: 'white'
              }
            }}
          >
            {formatDate(date)}
          </Button>
        ))}
        
        {/* + 일정 추가 버튼 */}
        <Button
          variant="outlined"
          onClick={handleAddDate}
          disabled={!canAddMoreDates()}
          sx={{
            minWidth: '100px',
            height: '40px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            borderStyle: 'dashed',
            color: 'primary.main',
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderStyle: 'solid'
            },
            '&:disabled': {
              opacity: 0.5,
              borderStyle: 'dashed'
            }
          }}
        >
          + 일정 추가
        </Button>
      </Box>

      {/* 현재 선택된 날짜 정보 */}
      {selectedDate && (
        <Box 
          sx={{ 
            p: 1.5, 
            backgroundColor: 'grey.50', 
            borderRadius: 1,
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            선택된 날짜: <strong>{formatDate(selectedDate)}</strong> ({selectedDate})
          </Typography>
          {currentTour?.startDate && (
            <Typography variant="caption" color="text.secondary">
              여행 {Math.ceil((new Date(selectedDate).getTime() - new Date(currentTour.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일차
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DateTabs;