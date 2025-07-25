import api, { ApiResponse } from './api';
import { ScheduleItemDto } from '../types/travel';

// Schedule API 서비스
export const scheduleAPI = {
  // 모든 일정 조회
  getAllSchedules: async (): Promise<ScheduleItemDto[]> => {
    const response = await api.get<ApiResponse<ScheduleItemDto[]>>('/schedules');
    return response.data.data;
  },

  // 특정 일정 조회
  getScheduleById: async (scheduleId: string): Promise<ScheduleItemDto> => {
    const response = await api.get<ApiResponse<ScheduleItemDto>>(`/schedules/${scheduleId}`);
    return response.data.data;
  },

  // 여행별 일정 목록 조회
  getSchedulesByTourId: async (tourId: string): Promise<ScheduleItemDto[]> => {
    const response = await api.get<ApiResponse<ScheduleItemDto[]>>(`/schedules/tour/${tourId}`);
    return response.data.data;
  },

  // 새 일정 생성
  createSchedule: async (scheduleData: Omit<ScheduleItemDto, 'scheduleId'>): Promise<ScheduleItemDto> => {
    const response = await api.post<ApiResponse<ScheduleItemDto>>('/schedules', scheduleData);
    return response.data.data;
  },

  // 일정 정보 수정
  updateSchedule: async (scheduleId: string, scheduleData: Partial<ScheduleItemDto>): Promise<ScheduleItemDto> => {
    const response = await api.put<ApiResponse<ScheduleItemDto>>(`/schedules/${scheduleId}`, scheduleData);
    return response.data.data;
  },

  // 일정 삭제
  deleteSchedule: async (scheduleId: string): Promise<void> => {
    await api.delete(`/schedules/${scheduleId}`);
  },

  // 일정 순서 변경
  reorderSchedules: async (tourId: number, scheduleIds: string[]): Promise<void> => {
    await api.put(`/schedules/tour/${tourId}/reorder`, { scheduleIds });
  },

  // 일정 시간 일괄 수정
  updateScheduleTimes: async (scheduleId: string, timeData: { startTime: string; endTime: string }): Promise<ScheduleItemDto> => {
    const response = await api.patch<ApiResponse<ScheduleItemDto>>(`/schedules/${scheduleId}/time`, timeData);
    return response.data.data;
  }
};

export default scheduleAPI;
