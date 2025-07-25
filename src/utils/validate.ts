import { TourType, ScheduleItemDto } from '../types/travel';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 여행 기본 정보 검증
 */
export const validateTour = (tour: Partial<TourType>): ValidationResult => {
  // 제목 검증
  if (!tour.title || tour.title.trim().length === 0) {
    return { isValid: false, message: '여행 제목을 입력해주세요.' };
  }
  
  if (tour.title.length > 100) {
    return { isValid: false, message: '여행 제목은 100자 이하로 입력해주세요.' };
  }

  // 날짜 검증
  if (!tour.startDate || !tour.endDate) {
    return { isValid: false, message: '여행 시작일과 종료일을 모두 입력해주세요.' };
  }

  const startDate = new Date(tour.startDate);
  const endDate = new Date(tour.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정

  if (startDate < today) {
    return { isValid: false, message: '시작일은 오늘 이후여야 합니다.' };
  }

  if (startDate > endDate) {
    return { isValid: false, message: '시작일은 종료일보다 이전이어야 합니다.' };
  }

  // 여행 기간이 너무 긴지 확인 (1년 이상)
  const maxDays = 365;
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    return { isValid: false, message: '여행 기간은 1년을 초과할 수 없습니다.' };
  }

  // 여행자 수 검증
  if (!tour.travelers || tour.travelers < 1 || tour.travelers > 50) {
    return { isValid: false, message: '여행자 수는 1명 이상 50명 이하로 입력해주세요.' };
  }

  // 예산 검증
  const validBudgets = ['low', 'medium', 'high', 'luxury'];
  if (!tour.budget || !validBudgets.includes(tour.budget)) {
    return { isValid: false, message: '예산 범위를 선택해주세요.' };
  }

  return { isValid: true };
};

/**
 * 일정 정보 검증
 */
export const validateSchedule = (schedule: Partial<ScheduleItemDto>, tourDate?: { startDate: string; endDate: string }): ValidationResult => {
  // 제목 검증
  if (!schedule.title || schedule.title.trim().length === 0) {
    return { isValid: false, message: '일정 제목을 입력해주세요.' };
  }

  // 날짜 검증
  if (!schedule.date) {
    return { isValid: false, message: '일정 날짜를 입력해주세요.' };
  }

  // 여행 기간 내 날짜인지 확인
  if (tourDate) {
    const scheduleDate = new Date(schedule.date);
    const startDate = new Date(tourDate.startDate);
    const endDate = new Date(tourDate.endDate);
    
    if (scheduleDate < startDate || scheduleDate > endDate) {
      return { isValid: false, message: '일정 날짜는 여행 기간 내에 있어야 합니다.' };
    }
  }

  // 시간 검증
  if (!schedule.startTime || !schedule.endTime) {
    return { isValid: false, message: '시작 시간과 종료 시간을 모두 입력해주세요.' };
  }

  // 시간 형식 검증 (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
    return { isValid: false, message: '시간은 HH:MM 형식으로 입력해주세요.' };
  }

  // 시작 시간이 종료 시간보다 이전인지 확인
  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes >= endMinutes) {
    return { isValid: false, message: '시작 시간은 종료 시간보다 이전이어야 합니다.' };
  }

  return { isValid: true };
};

/**
 * 날짜 유효성 검증
 */
export const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
  if (!startDate || !endDate) {
    return { isValid: false, message: '시작일과 종료일을 모두 입력해주세요.' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return { isValid: false, message: '시작일은 오늘 이후여야 합니다.' };
  }

  if (start > end) {
    return { isValid: false, message: '시작일은 종료일보다 이전이어야 합니다.' };
  }

  return { isValid: true };
};

/**
 * 여행 기간 계산
 */
export const calculateTripDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * 예산 범위 텍스트 변환
 */
export const getBudgetText = (budget: string): string => {
  const budgetMap: Record<string, string> = {
    low: '50만원 이하',
    medium: '50-100만원',
    high: '100-200만원',
    luxury: '200만원 이상'
  };
  return budgetMap[budget] || '예산 미정';
};

/**
 * 여행자 수 텍스트 변환
 */
export const getTravelersText = (travelers: number): string => {
  if (travelers === 1) return '1명 (혼자)';
  if (travelers === 2) return '2명 (커플/친구)';
  if (travelers === 3) return '3명';
  if (travelers === 4) return '4명 (가족)';
  if (travelers >= 5) return `${travelers}명`;
  return `${travelers}명`;
};