import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemSecondaryAction,
  Chip,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Train as TrainIcon, 
  DirectionsBus as BusIcon,
  DirectionsCar as CarIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTravelActions } from '../../store/travelStore';
import { RouteStep } from '../../types/travel';

// localStorage에서 저장된 교통편 타입 정의
interface SavedRoute {
  id: string;
  departure: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  transfers: number;
  price?: number;
  mode: 'TRANSIT' | 'DRIVING' | 'WALKING';
  route: RouteStep[]; // 정확한 타입 사용
  savedAt: string; // 저장된 시간
}

const TransportSection: React.FC = () => {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const { addRouteToSchedule } = useTravelActions();

  // localStorage에서 저장된 교통편 로드
  useEffect(() => {
    const loadSavedRoutes = () => {
      try {
        const saved = localStorage.getItem('savedRoutes');
        if (saved) {
          const routes = JSON.parse(saved);
          setSavedRoutes(routes);
        }
      } catch (error) {
        console.error('저장된 교통편 로드 실패:', error);
      }
    };

    loadSavedRoutes();
  }, []);

  // localStorage에 교통편 저장
  // const saveRoute = (route: Omit<SavedRoute, 'id' | 'savedAt'>) => {
  //   const newRoute: SavedRoute = {
  //     ...route,
  //     id: `route_${Date.now()}`,
  //     savedAt: new Date().toISOString()
  //   };

  //   const updatedRoutes = [newRoute, ...savedRoutes];
  //   setSavedRoutes(updatedRoutes);
  //   localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
    
  //   console.log('교통편 저장됨:', newRoute);
  // };

  // 저장된 교통편 삭제
  const deleteRoute = (routeId: string) => {
    const updatedRoutes = savedRoutes.filter(route => route.id !== routeId);
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
    
    console.log('교통편 삭제됨:', routeId);
  };

  // 교통편을 일정에 추가
  const addToSchedule = (route: SavedRoute) => {
    const routeResult = {
      departure: route.departure,
      destination: route.destination,
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      duration: route.duration,
      transfers: route.transfers,
      price: route.price || 0,
      route: route.route
    };

    addRouteToSchedule(routeResult);
    console.log('일정에 교통편 추가:', routeResult);
  };

  // 교통 수단별 아이콘 반환
  const getTransportIcon = (mode: string) => {
    switch (mode.toUpperCase()) {
      case 'TRANSIT':
        return <TrainIcon fontSize="small" />;
      case 'DRIVING':
        return <CarIcon fontSize="small" />;
      default:
        return <BusIcon fontSize="small" />;
    }
  };

  // 시간 포맷팅 (오전/오후 형식을 24시간으로 변환)
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      // 이미 24시간 형식인지 확인 (HH:MM 패턴)
      if (/^\d{1,2}:\d{2}$/.test(timeString.trim())) {
        return timeString.substring(0, 5); // HH:MM 형태로 제한
      }
      
      // "오전/오후" 형식 처리
      if (timeString.includes('오전') || timeString.includes('오후')) {
        const isAfternoon = timeString.includes('오후');
        const timeOnly = timeString.replace(/오전|오후/g, '').trim();
        const [hours, minutes] = timeOnly.split(':').map(Number);
        
        let hour24 = hours;
        if (isAfternoon && hours !== 12) {
          hour24 = hours + 12;
        } else if (!isAfternoon && hours === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      // 기본적으로 HH:MM 형태로 변환 시도
      return timeString.substring(0, 5);
    } catch (error) {
      console.error('시간 변환 오류:', error);
      return timeString;
    }
  };

  // 날짜 포맷팅
  const formatSavedDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return '최근';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🚗 교통 정보
        </Typography>
        <Chip 
          label={`${savedRoutes.length}개 저장됨`} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      </Box>

      {/* 설명 */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        지도에서 검색한 길찾기 결과가 여기에 저장됩니다. 
        원하는 교통편을 일정에 추가할 수 있습니다.
      </Typography>

      {/* 저장된 교통편 목록 */}
      {savedRoutes.length === 0 ? (
        <Box
          sx={{
            backgroundColor: '#f8f9fa',
            border: '2px dashed #e0e0e0',
            borderRadius: '8px',
            p: 3,
            textAlign: 'center',
            color: '#666'
          }}
        >
          <TrainIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            아직 저장된 교통편이 없습니다
          </Typography>
          <Typography variant="caption" color="text.secondary">
            지도에서 길찾기를 사용하면 여기에 저장됩니다
          </Typography>
        </Box>
      ) : (
        <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
          {savedRoutes.map((route) => (
            <React.Fragment key={route.id}>
              <ListItem
                sx={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {getTransportIcon(route.mode)}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  {/* Primary 정보 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {route.departure} → {route.destination}
                    </Typography>
                    <Chip 
                      label={`${route.duration}분`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                  
                  {/* Secondary 정보 */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" component="div">
                      {formatTime(route.departureTime)} → {formatTime(route.arrivalTime)} | 
                      환승 {route.transfers}회 | 
                      {route.price ? `${route.price.toLocaleString()}원` : '무료'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }} component="div">
                      저장: {formatSavedDate(route.savedAt)}
                    </Typography>
                  </Box>
                </Box>
                
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="일정에 추가">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => addToSchedule(route)}
                        sx={{ 
                          minWidth: '80px',
                          fontSize: '0.75rem',
                          borderRadius: '20px'
                        }}
                      >
                        추가
                      </Button>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteRoute(route.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* 도움말 */}
      {savedRoutes.length > 0 && (
        <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
          <Typography variant="caption">
            💡 <strong>팁:</strong> 길찾기 결과는 자동으로 여기에 저장됩니다. 
            "추가" 버튼을 클릭하면 현재 선택된 날짜의 일정에 추가됩니다.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default TransportSection;