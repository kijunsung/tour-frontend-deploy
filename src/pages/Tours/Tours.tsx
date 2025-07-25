import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Button, 
  Menu, 
  MenuItem, 
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { 
  PictureAsPdf, 
  DateRange, 
  CalendarToday,
  Preview
} from '@mui/icons-material';
import Maps from '../Maps/Maps';
import Weathers from '../Weathers/Weathers';
import { TravelInfo } from '../../components/TravelInfo';
import TransportSection from '../../components/TransportSection';
import ScheduleSection from './components/ScheduleSection';
import Save from '@mui/icons-material/Save';
import { useTravelActions, useTravelState } from '../../store/travelStore';

import { 
  TourType, 
  TravelPlanDto, 
  ScheduleItemDto, 
  LocationDataDto, 
  TrafficDataDto,
  WeatherItemDto,
  LocationData,
  VehicleData
} from '../../types/travel';
import { generateTourPdf, registerFonts } from '../Tours/TourPDF';

// 🆕 프론트엔드 데이터를 백엔드 구조로 변환하는 함수들
const convertLocationData = (locationJson: string): LocationDataDto | null => {
  try {
    const frontendLocation: LocationData = JSON.parse(locationJson);
    return {
      name: frontendLocation.name,
      address: frontendLocation.address,
      coordinates: {
        lat: frontendLocation.coordinates.lat,
        lng: frontendLocation.coordinates.lng
      },
      rating: frontendLocation.rating,
      googleMapLink: frontendLocation.link
    };
  } catch (error) {
    console.error('Location 데이터 변환 오류:', error);
    return null;
  }
};

const convertTrafficData = (vehicleJson: string): TrafficDataDto | null => {
  try {
    const frontendVehicle: VehicleData = JSON.parse(vehicleJson);
    return {
      mode: frontendVehicle.mode,
      departure: frontendVehicle.departure,
      destination: frontendVehicle.destination,
      price: 0, // TrafficType에서 별도로 가져와야 함
      totalDuration: frontendVehicle.totalDuration,
      transfers: frontendVehicle.transfers
    };
  } catch (error) {
    console.error('Traffic 데이터 변환 오류:', error);
    return null;
  }
};

// 액션 버튼 컴포넌트
const ActionButtons = () => {
  const { saveTourToBackend } = useTravelActions();
  const { 
    currentTour, 
    schedules, 
    mapEntities, 
    trafficData, 
    weatherData,
    availableDates 
  } = useTravelState();
  
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState<null | HTMLElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // 🆕 프론트엔드 데이터를 백엔드 TourType 구조로 변환
  const convertToBackendStructure = (filterDate?: string): TourType | null => {
    if (!currentTour) return null;

    // 날짜별 필터링
    let filteredSchedules = schedules;
    if (filterDate) {
      filteredSchedules = schedules.filter(schedule => schedule.date === filterDate);
    }

    // ScheduleItemDto 배열로 변환
    const scheduleItems: ScheduleItemDto[] = filteredSchedules.map(schedule => {
      // 관련 MapEntity 찾기
      const relatedMapEntity = mapEntities.find(entity => 
        entity.scheduleId === schedule.scheduleId
      );
      
      // 관련 TrafficData 찾기 (스케줄 제목 기반으로 매칭)
      const relatedTraffic = trafficData.find(traffic => 
        traffic.route && (
          traffic.route.includes(schedule.title) || 
          schedule.title.includes('🚇') ||
          schedule.title.includes('→')
        )
      );

      let locationData: LocationDataDto | undefined;
      let trafficDataConverted: TrafficDataDto | undefined;
      //let type: 'location' | 'traffic' = 'location';
      const types: ('location' | 'traffic')[] = [];

      if (relatedMapEntity) {
        locationData = convertLocationData(relatedMapEntity.location) || undefined;
        types.push('location');
      } else if (relatedTraffic) {
        trafficDataConverted = convertTrafficData(relatedTraffic.vehicle) || undefined;
        if (trafficDataConverted) {
          trafficDataConverted.price = relatedTraffic.price;
        }
        types.push('traffic');
      }

      return {
        scheduleId: schedule.scheduleId || Date.now().toString(),
        tourId: schedule.tourId,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime || '',
        title: schedule.title,
        content: schedule.content,
        memo: schedule.memo,
        types:  types.length > 0 ? types : undefined,
        locationData,
        trafficData: trafficDataConverted
      };
    });

    // WeatherItemDto 배열로 변환
    const weatherItems: WeatherItemDto[] = weatherData.map(weather => ({
      date: weather.date,
      temperature: weather.temperature,
      description: weather.description,
      icon: weather.icon || ''
    }));

    // TravelPlanDto 구조 생성
    const planData: TravelPlanDto = {
      schedules: scheduleItems,
      weatherData: weatherItems,
      metadata: {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalDays: availableDates.length,
        estimatedBudget: trafficData.reduce((sum, traffic) => sum + traffic.price, 0)
      }
    };

    // 최종 TourType 구조 반환
    return {
      ...currentTour,
      planData
    };
  };

  const getAvailableDates = () => {
    if (availableDates && availableDates.length > 0) {
      return availableDates;
    }
    
    if (!schedules || schedules.length === 0) return [];
    
    const dates = [...new Set(schedules.map(schedule => schedule.date))];
    return dates.sort();
  };

  const handleTourComplete = async () => {
    setSaveStatus('saving');
    try {
      const result = await saveTourToBackend();
      if (result) {
        setSaveStatus('saved');  // 저장 성공 시 상태 변경
        alert('여행 계획이 성공적으로 저장되었습니다! 해피 트립! 🎉');
      } else {
        setSaveStatus('idle');   // 실패 시 다시 idle로
        alert('저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      setSaveStatus('idle');
      console.error('여행 완료 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handlePdfMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPdfMenuAnchor(event.currentTarget);
  };

  const handlePdfMenuClose = () => {
    setPdfMenuAnchor(null);
  };

  // 🔧 PDF 다운로드 핸들러 - 폰트 등록 추가
  const handlePdfDownload = async (date?: string) => {
    
    try {
      // 🆕 PDF 생성 전 폰트 등록 확인
      await registerFonts();
      
      // 🆕 프론트엔드 데이터를 백엔드 구조로 변환
      const backendTour = convertToBackendStructure(date);
      
      if (!backendTour) {
        alert('여행 계획 데이터가 없습니다. 먼저 여행 계획을 작성해주세요.');
        return;
      }
      
      console.log('PDF 생성용 데이터:', backendTour);

      // 🔧 기존 pdfGenerator 함수 호출 (TourType 매개변수)
      await generateTourPdf(backendTour);
      
      handlePdfMenuClose();
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handlePreviewOpen = () => {
    setPreviewOpen(true);
    handlePdfMenuClose();
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          backgroundColor: 'white',
          borderTop: '1px solid #e0e0e0',
          borderRadius: '0 0 15px 15px'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* 임시저장, 미리보기 버튼 제거 */}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={handlePdfMenuOpen}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#45a049',
              },
              borderRadius: '25px',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            PDF 저장
          </Button>
          
          <Button 
            variant="contained"
            onClick={handleTourComplete}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
              borderRadius: '25px',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
            startIcon={
              saveStatus === 'saving' ? <CircularProgress size={16} color="inherit" /> : <Save />
            }
            disabled={saveStatus === 'saving'}
            color={saveStatus === 'saved' ? 'success' : 'primary'}
          >
            {saveStatus === 'saving' ? '저장 중...' : 
             saveStatus === 'saved' ? '저장됨' : '저장'}
          
          </Button>
        </Box>
      </Box>

      {/* PDF 옵션 메뉴 */}
      <Menu
        anchorEl={pdfMenuAnchor}
        open={Boolean(pdfMenuAnchor)}
        onClose={handlePdfMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <MenuItem onClick={() => handlePdfDownload()}>
          <DateRange sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="body2">전체 일정</Typography>
        </MenuItem>
        
        <MenuItem onClick={handlePreviewOpen}>
          <Preview sx={{ mr: 1, color: '#4caf50' }} />
          <Typography variant="body2">미리보기</Typography>
        </MenuItem>
        
        {getAvailableDates().map((date) => (
          <MenuItem key={date} onClick={() => handlePdfDownload(date)}>
            <CalendarToday sx={{ mr: 1, color: '#ff9800' }} />
            <Typography variant="body2">{date}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* 미리보기 다이얼로그 */}
      <Dialog 
        open={previewOpen} 
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '15px',
            minHeight: '500px'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Preview color="primary" />
          <Typography variant="h6" component="div">여행 계획 미리보기</Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            다음 옵션 중 하나를 선택하여 PDF를 생성하세요:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            <Chip
              label="전체 일정"
              color="primary"
              variant="outlined"
              icon={<DateRange />}
              onClick={() => {
                handlePdfDownload();
                handlePreviewClose();
              }}
              sx={{ cursor: 'pointer' }}
            />
            
            {getAvailableDates().map((date) => (
              <Chip
                key={date}
                label={date}
                color="secondary"
                variant="outlined"
                icon={<CalendarToday />}
                onClick={() => {
                  handlePdfDownload(date);
                  handlePreviewClose();
                }}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            💡 팁: 특정 날짜를 클릭하면 해당 날짜의 일정만 PDF로 저장됩니다.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handlePreviewClose} variant="outlined">
            취소
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ✅ 하나의 Tours 컴포넌트로 통합
const Tours: React.FC = () => {
  // 🆕 컴포넌트 마운트 시 폰트 미리 등록
  useEffect(() => {
    registerFonts().then((success) => {
      if (success) {
        console.log('✅ PDF 폰트 초기화 완료');
      } else {
        console.warn('⚠️ PDF 폰트 초기화 실패');
      }
    });
  }, []);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        p: 2
      }}
    >
      <Container maxWidth="xl">
        {/* 페이지 헤더 */}
        <Box 
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            p: 3,
            mb: 2,
            borderRadius: '15px'
          }}
        >
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>✈️ 나만의 여행 계획</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>완벽한 여행을 위한 스마트한 계획을 세워보세요</p>
        </Box>

        {/* 메인 레이아웃 */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: '70% 30%',
            gap: 2,
            mb: 2,
            '@media (max-width: 1024px)': {
              gridTemplateColumns: '1fr',
            }
          }}
        >
          {/* 70% 메인 영역 (지도 + 일정) */}
          <Box 
            sx={{ 
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 지도 영역 */}
            <Box 
              sx={{ 
                p: 2,
                pb: 1,
                flex: '0 0 450px'
              }}
            >
              <Box 
                sx={{ 
                  height: '100%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <Maps />
              </Box>
            </Box>

            {/* 일정 관리 영역 */}
            <Box 
              sx={{ 
                p: 2,
                pt: 1,
                flex: 1,
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <ScheduleSection />
            </Box>

            {/* 액션 버튼들 */}
            <ActionButtons />
          </Box>

          {/* 30% 사이드바 */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              '@media (max-width: 1024px)': {
                order: -1,
              }
            }}
          >
            {/* 여행 정보 */}
            <Box 
              sx={{ 
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              <TravelInfo />
            </Box>

            {/* 교통 정보 (신규 섹션) */}
            <Box 
              sx={{ 
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              <TransportSection />
            </Box>

            {/* 날씨 정보 */}
            <Box 
              sx={{ 
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              <Weathers />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Tours;