import api, { ApiResponse } from './api';
import { TourType } from '../types/travel';

// Tour API 서비스 - 백엔드 통합 저장 방식
export const tourAPI = {
  // 모든 여행 목록 조회
  getAllTours: async (): Promise<TourType[]> => {
    const response = await api.get<ApiResponse<TourType[]>>('/tours');
    return response.data.data;
  },

  // 특정 여행 조회
  getTourById: async (tourId: number): Promise<TourType> => {
    const response = await api.get<ApiResponse<TourType>>(`/tours/${tourId}`);
    return response.data.data;
  },

  // 사용자별 여행 목록 조회
  getToursByUserId: async (userId: number): Promise<TourType[]> => {
    const response = await api.get<ApiResponse<TourType[]>>(`/tours/user/${userId}`);
    return response.data.data;
  },

  // 새 여행 생성 (통합 저장)
  createTour: async (tourData: Omit<TourType, 'tourId' | 'createDate' | 'modifiedDate'>): Promise<TourType> => {
    const response = await api.post<ApiResponse<TourType>>('/tours', tourData);
    return response.data.data;
  },

  // 여행 정보 수정 (통합 저장)
  updateTour: async (tourId: number, tourData: Partial<TourType>): Promise<TourType> => {
    const response = await api.put<ApiResponse<TourType>>(`/tours/${tourId}`, tourData);
    return response.data.data;
  },

  // 여행 삭제
  deleteTour: async (tourId: number): Promise<void> => {
    await api.delete(`/tours/${tourId}`);
  },

  // 여행 계획 복사
  copyTour: async (tourId: number, newUserId: number): Promise<TourType> => {
    const response = await api.post<ApiResponse<TourType>>(`/tours/${tourId}/copy?newUserId=${newUserId}`);
    return response.data.data;
  },

  // 사용자의 여행 계획 개수 조회
  getUserTourCount: async (userId: number): Promise<number> => {
    const response = await api.get<ApiResponse<number>>(`/tours/user/${userId}/count`);
    return response.data.data;
  }
};

export default tourAPI;
