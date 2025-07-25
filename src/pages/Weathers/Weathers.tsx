import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Cloud as CloudIcon,
  LocationOn as LocationIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTravelStore } from '../../store/travelStore';
import { getWeatherForecast, WeatherAPIError } from '../../services/weatherService';

/**
 * Weathers Props 인터페이스
 */
interface WeathersProps {
  /** 날씨를 조회할 위치 (선택사항) */
  location?: { lat: number; lng: number; name?: string } | null;
  /** 컴팩트 모드 (기본값: true) */
  compact?: boolean;
}

/**
 * 날씨 위젯 컴포넌트
 * 
 * 구현 방식:
 * 1. travelStore의 selectedLocation 또는 props의 location 사용
 * 2. weatherService를 통한 실시간 날씨 조회
 * 3. 컴팩트한 5일 예보 표시
 * 4. 에러 처리 및 로딩 상태 관리
 * 
 * 왜 이 방식인가:
 * - Tours.tsx의 20% 영역에 최적화된 컴팩트 디자인
 * - 선택된 위치 자동 감지로 사용자 편의성 향상
 * - 실시간 데이터로 정확한 날씨 정보 제공
 */
const Weathers: React.FC<WeathersProps> = ({ 
  location = null}) => {
  // Zustand store 상태
  const { selectedLocation, weatherData, setWeatherData } = useTravelStore();
  
  // 로컬 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  /**
   * 실제 사용할 위치 결정
   * 
   * 우선순위:
   * 1. props로 전달된 location
   * 2. travelStore의 selectedLocation
   * 3. null (기본 위치 또는 선택 안내)
   */
  const currentLocation = useMemo(() => {
    if (location) {
      return {
        lat: location.lat,
        lng: location.lng,
        name: location.name || '선택된 위치'
      };
    }
    
    if (selectedLocation?.geometry?.location) {
      return {
        lat: selectedLocation.geometry.location.lat,
        lng: selectedLocation.geometry.location.lng,
        name: selectedLocation.name || selectedLocation.formatted_address || '선택된 위치'
      };
    }
    
    return null;
  }, [location, selectedLocation]);

  /**
   * 날씨 데이터 조회
   */
  const fetchWeatherData = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('날씨 조회 시작:', { lat, lng });
      
      const forecast = await getWeatherForecast(lat, lng);
      
      console.log('날씨 조회 완료:', forecast);
      
      setWeatherData(forecast);
      setLastUpdateTime(new Date());
      
    } catch (err) {
      console.error('날씨 조회 오류:', err);
      
      if (err instanceof WeatherAPIError) {
        setError(err.message);
      } else {
        setError('날씨 정보를 가져올 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 위치 변경 시 날씨 조회
   */
  useEffect(() => {
    console.log('Weathers: currentLocation 변경됨:', currentLocation);
    console.log('Weathers: selectedLocation from store:', selectedLocation);
    
    if (currentLocation) {
      fetchWeatherData(currentLocation.lat, currentLocation.lng);
    } else {
      // 위치가 없으면 날씨 데이터 초기화
      setWeatherData([]);
      setError('');
    }
  }, [currentLocation]);

  /**
   * 날씨 아이콘 URL 생성
   */
  const getWeatherIconUrl = (icon: string) => {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  };

  /**
   * 날짜 포맷팅 (MM/DD)
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  };

  /**
   * 요일 포맷팅
   */
  const formatDayOfWeek = (dateString: string, isToday: boolean = false) => {
    if (isToday) return '오늘';
    
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  /**
   * 오늘 날짜인지 확인
   */
  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // 위치가 선택되지 않은 경우
  if (!currentLocation) {
    return (
      <Paper 
        elevation={1}
        sx={{ 
          height: '100%',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CloudIcon sx={{ fontSize: 32, mb: 1, opacity: 0.8 }} />
          <Typography variant="h6" gutterBottom>
            날씨 정보
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            지도에서 위치를 선택하면<br />해당 지역의 날씨를 확인할 수 있습니다
          </Typography>
        </Box>
      </Paper>
    );
  }

  // 로딩 중인 경우
  if (isLoading) {
    return (
      <Paper 
        elevation={1}
        sx={{ 
          height: '100%',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: 'white', mb: 2 }} />
          <Typography variant="body2">
            날씨 정보를 가져오는 중...
          </Typography>
        </Box>
      </Paper>
    );
  }

  // 에러가 발생한 경우
  if (error) {
    const handleRetry = () => {
      if (currentLocation) {
        fetchWeatherData(currentLocation.lat, currentLocation.lng);
      }
    };

    return (
      <Paper 
        elevation={1}
        sx={{ 
          height: '100%',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ width: '100%' }}
          action={
            <RefreshIcon 
              sx={{ cursor: 'pointer' }}
              onClick={handleRetry}
            />
          }
        >
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Paper>
    );
  }

  // 날씨 데이터가 없는 경우
  if (!weatherData || weatherData.length === 0) {
    return (
      <Paper 
        elevation={1}
        sx={{ 
          height: '100%',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          <Typography variant="body2">
            날씨 정보를 불러올 수 없습니다.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  // 메인 날씨 표시
  return (
    <Paper 
      elevation={1}
      sx={{ 
        height: '100%',
        p: 1.5,
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 헤더 - 위치 정보 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <LocationIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.9 }} />
        <Typography 
          variant="caption" 
          sx={{ 
            opacity: 0.9,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}
        >
          {currentLocation.name}
        </Typography>
        {lastUpdateTime && (
          <Chip 
            label={lastUpdateTime.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            size="small"
            sx={{ 
              fontSize: '0.6rem',
              height: 16,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white'
            }}
          />
        )}
      </Box>

      {/* 5일 날씨 가로 배치 */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'stretch'
        }}
      >
        {weatherData.slice(0, 5).map((weather) => {
          const isTodayWeather = isToday(weather.date);
          
          return (
            <Box
              key={weather.date}
              sx={{
                flex: 1,
                backgroundColor: isTodayWeather 
                  ? 'rgba(255,255,255,0.25)' 
                  : 'rgba(255,255,255,0.15)',
                borderRadius: 1,
                p: 1,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 70,
                border: isTodayWeather ? '1px solid rgba(255,255,255,0.4)' : 'none'
              }}
            >
              {/* 요일 */}
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.6rem', 
                  fontWeight: isTodayWeather ? 'bold' : 'normal',
                  mb: 0.3,
                  color: 'white'
                }}
              >
                {formatDayOfWeek(weather.date, isTodayWeather)}
              </Typography>
              
              {/* 날짜 */}
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.55rem', 
                  opacity: 0.8,
                  mb: 0.5,
                  color: 'white'
                }}
              >
                {formatDate(weather.date)}
              </Typography>
              
              {/* 날씨 아이콘 */}
              {weather.icon && (
                <Box 
                  component="img"
                  src={getWeatherIconUrl(weather.icon)}
                  alt={weather.description}
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    mx: 'auto',
                    mb: 0.3
                  }}
                />
              )}
              
              {/* 온도 */}
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                {weather.temperature}°
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* 현재 날씨 설명 (오늘 날씨만) */}
      {weatherData[0] && (
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.65rem',
            opacity: 0.9,
            textAlign: 'center',
            mt: 0.5,
            fontStyle: 'italic'
          }}
        >
          {weatherData[0].description}
        </Typography>
      )}
    </Paper>
  );
};

export default Weathers;