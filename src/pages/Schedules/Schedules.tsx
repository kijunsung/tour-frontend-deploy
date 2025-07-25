import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
  Card,
  CardContent,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  LocationOn,
  DirectionsBus,
  Edit,
  Delete,
  Save,
  Refresh,
  MoreVert,
  AccessTime,
  Today,
} from '@mui/icons-material';
import { useTravelState, useTravelActions } from '../../store/travelStore';
import { ScheduleItemDto, MapEntityType, TrafficType, LocationData, VehicleData } from '../../types/travel';

interface ScheduleItemProps {
  schedule: ScheduleItemDto;
  mapEntity?: MapEntityType;
  trafficData?: TrafficType;
  onEditTime: (schedule: ScheduleItemDto) => void;
  onDelete: (scheduleId: string) => void;
}

// 개별 일정 아이템 컴포넌트
const ScheduleItem: React.FC<ScheduleItemProps> = ({
  schedule,
  mapEntity,
  trafficData,
  onEditTime,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEditTime(schedule);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(schedule.scheduleId!);
    handleMenuClose();
  };

  // 일정 타입 판별
  const isLocationSchedule = Boolean(mapEntity);
  const isTrafficSchedule = Boolean(trafficData);

  // LocationData 파싱
  const locationData: LocationData | null = mapEntity 
    ? JSON.parse(mapEntity.location) 
    : null;

  // VehicleData 파싱
  const vehicleData: VehicleData | null = trafficData 
    ? JSON.parse(trafficData.vehicle) 
    : null;

  return (
    <Card
      sx={{
        mb: 2,
        border: '1px solid #e0e0e0',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* 일정 타입 아이콘 */}
          <Avatar
            sx={{
              bgcolor: isLocationSchedule ? 'primary.main' : 'success.main',
              width: 40,
              height: 40,
            }}
          >
            {isLocationSchedule ? <LocationOn /> : <DirectionsBus />}
          </Avatar>

          {/* 일정 내용 */}
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" component="h3" gutterBottom>
                {schedule.title}
              </Typography>
              <IconButton size="small" onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {schedule.content}
            </Typography>

            {/* 시간 정보 */}
            <Box display="flex" alignItems="center" gap={2} mt={1}>
              <Chip
                icon={<AccessTime />}
                label={`${schedule.startTime} - ${schedule.endTime}`}
                size="small"
                color="primary"
                variant="outlined"
                clickable
                onClick={() => onEditTime(schedule)}
              />
              <Chip
                icon={<Today />}
                label={schedule.date}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* 위치 정보 (여행지인 경우) */}
            {isLocationSchedule && locationData && (
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  📍 {locationData.address}
                </Typography>
                {locationData.rating && (
                  <Typography variant="caption" color="text.secondary" ml={1}>
                    ⭐ {locationData.rating}
                  </Typography>
                )}
              </Box>
            )}

            {/* 교통편 정보 (교통편인 경우) */}
            {isTrafficSchedule && vehicleData && (
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  🚌 {vehicleData.totalDuration} · 환승 {vehicleData.transfers}회
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          시간 수정
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          삭제
        </MenuItem>
      </Menu>
    </Card>
  );
};

// 시간 편집 다이얼로그
interface TimeEditDialogProps {
  open: boolean;
  schedule: ScheduleItemDto | null;
  onClose: () => void;
  onSave: (scheduleId: string, startTime: string, endTime: string, date: string) => void;
}

const TimeEditDialog: React.FC<TimeEditDialogProps> = ({
  open,
  schedule,
  onClose,
  onSave,
}) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [date, setDate] = useState('');

  React.useEffect(() => {
    if (schedule) {
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setDate(schedule.date);
    }
  }, [schedule]);

  const handleSave = () => {
    if (schedule) {
      onSave(schedule.scheduleId!, startTime, endTime, date);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>일정 시간 수정</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="날짜"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="시작 시간"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="종료 시간"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 메인 Schedules 컴포넌트
const Schedules: React.FC = () => {
  const { schedules, mapEntities, trafficData, currentTour } = useTravelState();
  const { updateSchedule, removeSchedule, loadSampleData, saveTourToBackend } = useTravelActions();
  
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItemDto | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // 일정을 날짜별로 그룹핑
  const groupedSchedules = React.useMemo(() => {
    const groups: { [date: string]: ScheduleItemDto[] } = {};
    schedules.forEach(schedule => {
      if (!groups[schedule.date]) {
        groups[schedule.date] = [];
      }
      groups[schedule.date].push(schedule);
    });

    // 각 날짜별로 시간순 정렬
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return groups;
  }, [schedules]);

  // 시간 수정 핸들러
  const handleEditTime = useCallback((schedule: ScheduleItemDto) => {
    setEditingSchedule(schedule);
  }, []);

  const handleTimeUpdate = useCallback((
    scheduleId: string,
    startTime: string,
    endTime: string,
    date: string
  ) => {
    updateSchedule(scheduleId, { startTime, endTime, date });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [updateSchedule]);

  // 일정 삭제 핸들러
  const handleDeleteSchedule = useCallback((scheduleId: string) => {
    removeSchedule(scheduleId);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [removeSchedule]);

  // 저장 핸들러 (백엔드 API 연동)
  const handleSave = useCallback(async () => {
    if (!currentTour) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');
    try {
      // 백엔드에 저장
      const savedTour = await saveTourToBackend();
      
      if (savedTour) {
        console.log('백엔드 저장 성공:', savedTour);
        setSaveStatus('saved');
        
        // 로컬 스토리지에도 백업 저장
        localStorage.setItem('travel-schedules-backup', JSON.stringify({
          schedules,
          mapEntities,
          trafficData,
          lastSaved: new Date().toISOString(),
          tourId: savedTour.tourId
        }));
      } else {
        setSaveStatus('error');
      }
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [currentTour, schedules, mapEntities, trafficData, saveTourToBackend]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* 헤더 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1" fontWeight="bold">
          여행 일정
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            size="small"
            onClick={() => window.location.reload()}
          >
            새로고침
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={loadSampleData}
            color="secondary"
          >
            샘플 데이터
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            color={saveStatus === 'saved' ? 'success' : 'primary'}
          >
            {saveStatus === 'saving' ? '저장 중...' : 
             saveStatus === 'saved' ? '저장됨' : '저장'}
          </Button>
        </Box>
      </Box>

      {/* 상태 메시지 */}
      {saveStatus === 'saved' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          일정이 성공적으로 저장되었습니다.
        </Alert>
      )}
      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          저장 중 오류가 발생했습니다. 다시 시도해주세요.
        </Alert>
      )}

      {/* 일정 목록 */}
      <Box flex={1} sx={{ overflowY: 'auto' }}>
        {schedules.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: 'grey.50',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              아직 일정이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              지도에서 여행지를 검색하거나 길찾기를 통해 일정을 추가해보세요.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {Object.entries(groupedSchedules).map(([date, dateSchedules]) => (
              <Box key={date} mb={4}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  📅 {new Date(date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box>
                  {dateSchedules.map((schedule) => {
                    const mapEntity = mapEntities.find(
                      entity => entity.scheduleId === schedule.scheduleId
                    );
                    const traffic = trafficData.find(
                      traffic => traffic.tourId === schedule.tourId && 
                      traffic.departureTime === schedule.startTime
                    );

                    return (
                      <ScheduleItem
                        key={schedule.scheduleId}
                        schedule={schedule}
                        mapEntity={mapEntity}
                        trafficData={traffic}
                        onEditTime={handleEditTime}
                        onDelete={handleDeleteSchedule}
                      />
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* 시간 편집 다이얼로그 */}
      <TimeEditDialog
        open={Boolean(editingSchedule)}
        schedule={editingSchedule}
        onClose={() => setEditingSchedule(null)}
        onSave={handleTimeUpdate}
      />

      {/* 일정 통계 */}
      {schedules.length > 0 && (
        <Paper sx={{ mt: 2, p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            총 {schedules.length}개 일정 · 
            여행지 {mapEntities.length}개 · 
            교통편 {trafficData.length}개
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Schedules;