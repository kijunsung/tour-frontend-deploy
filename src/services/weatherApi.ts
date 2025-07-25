import api, { ApiResponse } from './api';
import { WeatherType } from '../types/travel';

// Weather API 서비스
export const weatherAPI = {
  // 모든 날씨 정보 조회
  getAllWeather: async (): Promise<WeatherType[]> => {
    const response = await api.get<ApiResponse<WeatherType[]>>('/weather');
    return response.data.data;
  },

  // 특정 날씨 정보 조회
  getWeatherById: async (weatherId: number): Promise<WeatherType> => {
    const response = await api.get<ApiResponse<WeatherType>>(`/weather/${weatherId}`);
    return response.data.data;
  },

  // 여행별 날씨 정보 목록 조회
  getWeatherByTourId: async (tourId: number): Promise<WeatherType[]> => {
    const response = await api.get<ApiResponse<WeatherType[]>>(`/weather/tour/${tourId}`);
    return response.data.data;
  },

  // 새 날씨 정보 생성
  createWeather: async (weatherData: Omit<WeatherType, 'weatherId'>): Promise<WeatherType> => {
    const response = await api.post<ApiResponse<WeatherType>>('/weather', weatherData);
    return response.data.data;
  },

  // 날씨 정보 수정
  updateWeather: async (weatherId: number, weatherData: Partial<WeatherType>): Promise<WeatherType> => {
    const response = await api.put<ApiResponse<WeatherType>>(`/weather/${weatherId}`, weatherData);
    return response.data.data;
  },

  // 날씨 정보 삭제
  deleteWeather: async (weatherId: number): Promise<void> => {
    await api.delete(`/weather/${weatherId}`);
  },

  // 여러 날씨 정보 일괄 생성
  createMultipleWeather: async (weatherDataList: Omit<WeatherType, 'weatherId'>[]): Promise<WeatherType[]> => {
    const response = await api.post<ApiResponse<WeatherType[]>>('/weather/bulk', weatherDataList);
    return response.data.data;
  },

  // 여행의 모든 날씨 정보 삭제
  deleteWeatherByTourId: async (tourId: number): Promise<void> => {
    await api.delete(`/weather/tour/${tourId}`);
  },

  // 위치별 실시간 날씨 조회 (OpenWeather API 연동)
  getCurrentWeather: async (lat: number, lng: number): Promise<WeatherType> => {
    const response = await api.get<ApiResponse<WeatherType>>('/weather/current', {
      params: { lat, lng }
    });
    return response.data.data;
  },

  // 위치별 5일 날씨 예보 조회 (OpenWeather API 연동)
  getWeatherForecast: async (lat: number, lng: number): Promise<WeatherType[]> => {
    const response = await api.get<ApiResponse<WeatherType[]>>('/weather/forecast', {
      params: { lat, lng }
    });
    return response.data.data;
  }
};

export default weatherAPI;
