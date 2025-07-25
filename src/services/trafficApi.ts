import api, { ApiResponse } from './api';
import { TrafficType } from '../types/travel';

// Traffic API 서비스
export const trafficAPI = {
  // 모든 교통편 조회
  getAllTraffic: async (): Promise<TrafficType[]> => {
    const response = await api.get<ApiResponse<TrafficType[]>>('/traffic');
    return response.data.data;
  },

  // 특정 교통편 조회
  getTrafficById: async (trafficId: number): Promise<TrafficType> => {
    const response = await api.get<ApiResponse<TrafficType>>(`/traffic/${trafficId}`);
    return response.data.data;
  },

  // 여행별 교통편 목록 조회
  getTrafficByTourId: async (tourId: number): Promise<TrafficType[]> => {
    const response = await api.get<ApiResponse<TrafficType[]>>(`/traffic/tour/${tourId}`);
    return response.data.data;
  },

  // 새 교통편 생성
  createTraffic: async (trafficData: Omit<TrafficType, 'trafficId'>): Promise<TrafficType> => {
    const response = await api.post<ApiResponse<TrafficType>>('/traffic', trafficData);
    return response.data.data;
  },

  // 교통편 정보 수정
  updateTraffic: async (trafficId: number, trafficData: Partial<TrafficType>): Promise<TrafficType> => {
    const response = await api.put<ApiResponse<TrafficType>>(`/traffic/${trafficId}`, trafficData);
    return response.data.data;
  },

  // 교통편 삭제
  deleteTraffic: async (trafficId: number): Promise<void> => {
    await api.delete(`/traffic/${trafficId}`);
  },

  // 여러 교통편 일괄 생성
  createMultipleTraffic: async (trafficDataList: Omit<TrafficType, 'trafficId'>[]): Promise<TrafficType[]> => {
    const response = await api.post<ApiResponse<TrafficType[]>>('/traffic/bulk', trafficDataList);
    return response.data.data;
  },

  // 여행의 모든 교통편 삭제
  deleteTrafficByTourId: async (tourId: number): Promise<void> => {
    await api.delete(`/traffic/tour/${tourId}`);
  },

  // 교통편 검색 (출발지, 도착지 기반)
  searchTraffic: async (searchParams: {
    departure: string;
    destination: string;
    departureTime?: string;
    tourId: number;
  }): Promise<TrafficType[]> => {
    const response = await api.get<ApiResponse<TrafficType[]>>('/traffic/search', {
      params: searchParams
    });
    return response.data.data;
  }
};

export default trafficAPI;
