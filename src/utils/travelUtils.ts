// 여행 관련 유틸리티 함수들

import { 
  LocationData, 
  VehicleData,  
  ScheduleItemDto,
} from '../types/travel';

/**
 * Google Place Result를 LocationData로 변환
 * Google Maps API에서 반환하는 실제 PlaceResult 타입을 처리
 */
export const convertPlaceToLocationData = (place: google.maps.places.PlaceResult): LocationData => {
  const location = place.geometry?.location as google.maps.LatLng | undefined;

  const lat = location?.lat() ?? 0;
  const lng = location?.lng() ?? 0;

  return {
    name: place.name || '',
    link: `https://maps.google.com/maps?place_id=${place.place_id}`,
    placeId: place.place_id || '',
    address: place.formatted_address || '',
    coordinates: {
      lat,
      lng,
    },
    photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 }),
    rating: place.rating,
  };
};


/**
 * LocationData JSON 문자열을 파싱
 */
export const parseLocationData = (locationJson: string): LocationData | null => {
  try {
    return JSON.parse(locationJson) as LocationData;
  } catch (error) {
    console.error('Failed to parse location data:', error);
    return null;
  }
};

/**
 * VehicleData JSON 문자열을 파싱
 */
export const parseVehicleData = (vehicleJson: string): VehicleData | null => {
  try {
    return JSON.parse(vehicleJson) as VehicleData;
  } catch (error) {
    console.error('Failed to parse vehicle data:', error);
    return null;
  }
};

/**
 * 기본 시간 생성 (현재 시간 기준)
 */
export const generateDefaultTime = (offsetHours: number = 0): string => {
  const now = new Date();
  now.setHours(now.getHours() + offsetHours);
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * 시간 문자열을 Date 객체로 변환
 */
export const timeStringToDate = (timeString: string, baseDate?: Date): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = baseDate ? new Date(baseDate) : new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * 분 단위를 시:분 형식으로 변환
 */
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * 시:분 형식을 분 단위로 변환
 */
export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * 일정을 시간 순으로 정렬
 */
export const sortSchedulesByTime = (schedules: ScheduleItemDto[]): ScheduleItemDto[] => {
  return [...schedules].sort((a, b) => {
    const timeA = timeStringToMinutes(a.startTime);
    const timeB = timeStringToMinutes(b.startTime);
    return timeA - timeB;
  });
};

/**
 * 날짜별로 일정 그룹화
 */
export const groupSchedulesByDate = (schedules: ScheduleItemDto[]): Record<string, ScheduleItemDto[]> => {
  return schedules.reduce((groups, schedule) => {
    const date = schedule.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(schedule);
    return groups;
  }, {} as Record<string, ScheduleItemDto[]>);
};

/**
 * 여행 일수 계산
 */
export const calculateTripDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // 시작일도 포함
};

/**
 * 여행 날짜 배열 생성
 */
export const generateTripDates = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * 날짜를 한국어 형식으로 포맷
 */
export const formatDateToKorean = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  
  return `${month}/${day} (${dayOfWeek})`;
};

/**
 * 소요시간을 읽기 쉬운 형식으로 변환
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}시간`;
  }
  
  return `${hours}시간 ${mins}분`;
};

/**
 * 가격을 한국 원화 형식으로 포맷
 */
export const formatPrice = (price: number): string => {
  if (price === 0) {
    return '요금 정보 없음';
  }
  
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(price);
};

/**
 * 별점을 별 이모지로 변환
 */
export const formatRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  let stars = '★'.repeat(fullStars);
  if (hasHalfStar) {
    stars += '☆';
  }
  
  return stars + ` (${rating.toFixed(1)})`;
};

/**
 * 거리 정보 포맷 (미터 단위)
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters}m`;
  }
  
  const kilometers = (meters / 1000).toFixed(1);
  return `${kilometers}km`;
};

/**
 * 일정 충돌 검사
 */
export const checkScheduleConflict = (
  newSchedule: { startTime: string; endTime: string; date: string },
  existingSchedules: ScheduleItemDto[]
): boolean => {
  const newStart = timeStringToMinutes(newSchedule.startTime);
  const newEnd = timeStringToMinutes(newSchedule.endTime);
  
  return existingSchedules.some(schedule => {
    if (schedule.date !== newSchedule.date) return false;
    
    const existingStart = timeStringToMinutes(schedule.startTime);
    const existingEnd = timeStringToMinutes(schedule.endTime);
    
    // 시간 겹침 검사
    return (newStart < existingEnd && newEnd > existingStart);
  });
};

/**
 * 다음 가능한 시간 제안
 */
export const suggestNextAvailableTime = (
  date: string,
  existingSchedules: ScheduleItemDto[],
  durationMinutes: number = 120
): { startTime: string; endTime: string } => {
  const dateSchedules = existingSchedules
    .filter(s => s.date === date)
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));
  
  if (dateSchedules.length === 0) {
    // 첫 번째 일정이라면 오전 9시 시작
    return {
      startTime: '09:00',
      endTime: minutesToTimeString(9 * 60 + durationMinutes)
    };
  }
  
  // 마지막 일정 이후에 배치
  const lastSchedule = dateSchedules[dateSchedules.length - 1];
  const startMinutes = timeStringToMinutes(lastSchedule.endTime);
  
  return {
    startTime: minutesToTimeString(startMinutes),
    endTime: minutesToTimeString(startMinutes + durationMinutes)
  };
};

/**
 * 로컬 스토리지에 임시 저장
 */
export const saveTempData = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(`travel_temp_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save temp data:', error);
  }
};

/**
 * 로컬 스토리지에서 임시 데이터 로드
 */
export const loadTempData = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(`travel_temp_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load temp data:', error);
    return null;
  }
};

/**
 * 임시 데이터 삭제
 */
export const clearTempData = (key: string): void => {
  try {
    localStorage.removeItem(`travel_temp_${key}`);
  } catch (error) {
    console.error('Failed to clear temp data:', error);
  }
};
