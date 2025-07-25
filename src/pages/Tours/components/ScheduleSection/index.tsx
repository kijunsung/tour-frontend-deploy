import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useTravelState, useTravelActions } from '../../../../store/travelStore';
import DateTabs from './DateTabs';
import ScheduleList from './ScheduleList';

const ScheduleSection: React.FC = () => {
  const { currentTour, availableDates, selectedDate } = useTravelState();
  const { generateAvailableDates, setSelectedDate } = useTravelActions();

  // 여행 정보가 변경되면 사용 가능한 날짜 재생성
  useEffect(() => {
    if (currentTour?.startDate && currentTour?.endDate) {
      generateAvailableDates();
    }
  }, [currentTour?.startDate, currentTour?.endDate, generateAvailableDates]);

  // 첫 번째 사용 가능한 날짜가 있고 선택된 날짜가 없으면 자동 선택
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate, setSelectedDate]);

  return (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* 날짜 탭 영역 */}
      <Box sx={{ flexShrink: 0 }}>
        <DateTabs />
      </Box>

      {/* 일정 목록 영역 - 스크롤 가능 */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          pr: 1 // 스크롤바 여백
        }}
      >
        <ScheduleList />
      </Box>
    </Box>
  );
};

export default ScheduleSection;