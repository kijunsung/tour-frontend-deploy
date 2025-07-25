import api, { ApiResponse } from './api';
import { MapEntityType } from '../types/travel';

// MapEntity API 서비스
export const mapAPI = {
  // 모든 지도 엔티티 조회
  getAllMapEntities: async (): Promise<MapEntityType[]> => {
    const response = await api.get<ApiResponse<MapEntityType[]>>('/map-entities');
    return response.data.data;
  },

  // 특정 지도 엔티티 조회
  getMapEntityById: async (mapId: number): Promise<MapEntityType> => {
    const response = await api.get<ApiResponse<MapEntityType>>(`/map-entities/${mapId}`);
    return response.data.data;
  },

  // 일정별 지도 엔티티 목록 조회
  getMapEntitiesByScheduleId: async (scheduleId: string): Promise<MapEntityType[]> => {
    const response = await api.get<ApiResponse<MapEntityType[]>>(`/map-entities/schedule/${scheduleId}`);
    return response.data.data;
  },

  // 여행별 지도 엔티티 목록 조회
  getMapEntitiesByTourId: async (tourId: number): Promise<MapEntityType[]> => {
    const response = await api.get<ApiResponse<MapEntityType[]>>(`/map-entities/tour/${tourId}`);
    return response.data.data;
  },

  // 새 지도 엔티티 생성
  createMapEntity: async (mapData: Omit<MapEntityType, 'mapId'>): Promise<MapEntityType> => {
    const response = await api.post<ApiResponse<MapEntityType>>('/map-entities', mapData);
    return response.data.data;
  },

  // 지도 엔티티 정보 수정
  updateMapEntity: async (mapId: number, mapData: Partial<MapEntityType>): Promise<MapEntityType> => {
    const response = await api.put<ApiResponse<MapEntityType>>(`/map-entities/${mapId}`, mapData);
    return response.data.data;
  },

  // 지도 엔티티 삭제
  deleteMapEntity: async (mapId: number): Promise<void> => {
    await api.delete(`/map-entities/${mapId}`);
  },

  // 여러 지도 엔티티 일괄 생성
  createMultipleMapEntities: async (mapDataList: Omit<MapEntityType, 'mapId'>[]): Promise<MapEntityType[]> => {
    const response = await api.post<ApiResponse<MapEntityType[]>>('/map-entities/bulk', mapDataList);
    return response.data.data;
  },

  // 일정의 모든 지도 엔티티 삭제
  deleteMapEntitiesByScheduleId: async (scheduleId: string): Promise<void> => {
    await api.delete(`/map-entities/schedule/${scheduleId}`);
  }
};

export default mapAPI;
