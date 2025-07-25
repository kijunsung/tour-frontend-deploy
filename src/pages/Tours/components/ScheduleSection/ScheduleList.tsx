import React, { useMemo, useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { LocationOn as LocationIcon, Train as TrainIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useTravelState, useTravelActions } from '../../../../store/travelStore';
import { ScheduleItemDto } from '../../../../types/travel';
import ScheduleEditModal from './ScheduleEditModal';


// ScheduleItemDto 불러와서 임포트해야 메모 저장됨 내일 할일

// 드래그 가능한 ScheduleItem 컴포넌트
const ScheduleItem: React.FC<{ 
  schedule: ScheduleItemDto; 
  isDragging?: boolean;
  onEdit: (schedule: ScheduleItemDto) => void;
}> = ({ 
  schedule, 
  isDragging = false,
  onEdit
}) => {
  const { removeSchedule, focusMapOnLocation } = useTravelActions();
  const { mapEntities } = useTravelState();
  
  // 교통편 여부 확인 (제목에 이모지로 구분)
  const isTransport = schedule.title.includes('🚇') || schedule.title.includes('🚌') || schedule.title.includes('🚗');
  
  // 해당 스케줄의 위치 정보 찾기
  const locationEntity = mapEntities.find(entity => entity.scheduleId === schedule.scheduleId);
  
  const handleRemove = () => {
    if (window.confirm('이 일정을 삭제하시겠습니까?') && schedule.scheduleId) {
      removeSchedule(schedule.scheduleId);
    }
  };

  // 일정 클릭 시 지도에서 위치 표시
  const handleScheduleClick = () => {
    if (locationEntity && !isTransport) {
      try {
        const locationData = JSON.parse(locationEntity.location);
        console.log('일정 클릭 - 지도 포커스:', locationData);
        focusMapOnLocation(locationData);
      } catch (error) {
        console.error('위치 데이터 파싱 오류:', error);
      }
    }
  };

  return (
    <Paper
      elevation={isDragging ? 8 : 1}
      sx={{
        p: 2,
        mb: 1,
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        cursor: locationEntity && !isTransport ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.1)' : 'white',
        transform: isDragging ? 'rotate(2deg)' : 'none',
        '&:hover': {
          boxShadow: locationEntity && !isTransport ? 3 : 1,
          borderColor: locationEntity && !isTransport ? 'primary.main' : '#e0e0e0',
          backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.1)' : (locationEntity && !isTransport ? 'rgba(25, 118, 210, 0.04)' : 'inherit')
        }
      }}
    >
      <Box 
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={handleScheduleClick}
      >
        {/* 드래그 핸들 + 시간 + 아이콘 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '140px' }}>
          {/* 드래그 핸들 */}
          <DragIcon 
            sx={{ 
              color: 'text.secondary', 
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              fontSize: '1rem'
            }} 
          />
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: '80px',
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            {isTransport ? <TrainIcon fontSize="small" /> : <LocationIcon fontSize="small" />}
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              {schedule.startTime}
            </Typography>
          </Box>
        </Box>

        {/* 중간: 일정 정보 */}
        <Box sx={{ flex: 1, mx: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {schedule.title}
            {locationEntity && !isTransport && (
              <Typography 
                component="span" 
                variant="caption" 
                sx={{ 
                  ml: 1, 
                  color: 'primary.main', 
                  fontSize: '0.7rem',
                  opacity: 0.7
                }}
              >
                🗺️ 지도에서 보기
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {schedule.content}
          </Typography>
          {schedule.memo && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                color: 'primary.dark',
                p: 0.5,
                borderRadius: 0.5,
                mt: 0.5,
                fontStyle: 'italic'
              }}
            >
              📝 {schedule.memo}
            </Typography>
          )}
        </Box>

        {/* 오른쪽: 액션 버튼들 */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button 
            size="small" 
            variant="outlined" 
            sx={{ minWidth: '60px', fontSize: '0.75rem' }}
            onClick={(e) => {
              e.stopPropagation(); // 부모 클릭 이벤트 방지
              onEdit(schedule);
            }}
          >
            수정
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color="error"
            onClick={(e) => {
              e.stopPropagation(); // 부모 클릭 이벤트 방지
              handleRemove();
            }}
            sx={{ minWidth: '60px', fontSize: '0.75rem' }}
          >
            삭제
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

const ScheduleList: React.FC = () => {
  const { schedules, selectedDate } = useTravelState();
  const { updateSchedule } = useTravelActions();
  
  // 수정 모달 상태 관리
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItemDto | null>(null);

  // 선택된 날짜의 일정들만 필터링 (드래그앤드롭 순서 우선, 시간 순서는 백업)
  const todaySchedules = useMemo(() => {
    if (!selectedDate) return [];
    
    return schedules
      .filter(schedule => schedule.date === selectedDate)
      .sort((a, b) => {
        // 1순위: order 필드가 있으면 우선 (드래그앤드롭 순서)
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        
        // 2순위: order가 없는 경우만 시간 순 정렬 (기존 데이터 호환용)
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [schedules, selectedDate]);
  
  // 수정 모달 열기
  const handleEditSchedule = (schedule: ScheduleItemDto) => {
    setEditingSchedule(schedule);
    setEditModalOpen(true);
  };

  // 수정 모달 닫기
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingSchedule(null);
  };

  // 일정 업데이트 처리
  const handleUpdateSchedule = (scheduleId: string, updates: Partial<ScheduleItemDto>) => {
    updateSchedule(scheduleId, updates);
    console.log('일정 수정 완료:', { scheduleId, updates });
  };

  // 드래그 완료 후 순서 업데이트
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedDate) {
      return;
    }

    const items = Array.from(todaySchedules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 순서 변경된 일정들에 order 필드 업데이트
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index // 0, 1, 2, 3... 순서로 업데이트
    }));

    // 스토어에 각 일정의 order 필드 업데이트
    updatedItems.forEach(item => {
      if (item.scheduleId) {
        updateSchedule(item.scheduleId, { order: item.order });
      }
    });
    
    console.log('드래그앤드롭 완료:', {
      from: result.source.index,
      to: result.destination.index,
      reorderedSchedules: updatedItems.map(item => ({ 
        id: item.scheduleId, 
        title: item.title, 
        order: item.order 
      }))
    });
  };

  // 빈 상태 컴포넌트
  const EmptyState = () => (
    <Box
      sx={{
        backgroundColor: '#f8f9fa',
        border: '2px dashed #e0e0e0',
        borderRadius: '10px',
        p: 4,
        textAlign: 'center',
        color: '#666',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: '#e3f2fd'
        }
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>📍</Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        새로운 장소를 추가해보세요
      </Typography>
      <Typography variant="body2" color="text.secondary">
        지도에서 선택하거나 검색으로 추가할 수 있습니다
      </Typography>
    </Box>
  );

  if (!selectedDate) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          날짜를 선택해주세요
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          상단의 날짜 탭을 클릭하거나 새로운 일정을 추가해보세요
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '300px' }}>
      {/* 일정 목록 - 드래그앤드롭 지원 */}
      {todaySchedules.length === 0 ? (
        <EmptyState />
      ) : (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="schedule-list">
            {(provided, snapshot) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
                sx={{
                  backgroundColor: snapshot.isDraggingOver ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease',
                  minHeight: '100px'
                }}
              >
                {todaySchedules.map((schedule, index) => (
                  <Draggable 
                    key={schedule.scheduleId || `schedule-${index}`} 
                    draggableId={schedule.scheduleId || `schedule-${index}`} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          // 드래그 중일 때 마진 제거
                          marginBottom: snapshot.isDragging ? '0' : '8px'
                        }}
                      >
                        <ScheduleItem 
                          schedule={schedule} 
                          isDragging={snapshot.isDragging}
                          onEdit={handleEditSchedule}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {/* 추가 일정 placeholder */}
                <Box
                  sx={{
                    backgroundColor: '#f8f9fa',
                    border: '1px dashed #e0e0e0',
                    borderRadius: '8px',
                    p: 2,
                    textAlign: 'center',
                    color: '#999',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    mt: 1,
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: '#e3f2fd',
                      color: 'primary.main'
                    }
                  }}
                >
                  <Typography variant="body2">
                    + 새로운 일정 추가
                  </Typography>
                </Box>
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* 날짜 정보 요약 */}
      {todaySchedules.length > 0 && (
        <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 총 {todaySchedules.length}개의 일정이 있습니다. 드래그로 순서를 변경할 수 있습니다.
          </Typography>
        </Box>
      )}

      {/* 수정 모달 */}
      <ScheduleEditModal
        open={editModalOpen}
        schedule={editingSchedule}
        onClose={handleCloseEditModal}
        onSave={handleUpdateSchedule}
      />
    </Box>
  );
};

export default ScheduleList;