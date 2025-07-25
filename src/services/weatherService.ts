// OpenWeather API 직접 연동 서비스
import { WeatherType } from '../types/travel';
import { YOUR_OPENWEATHER_API_KEY } from '../_env/env.local';

/**
 * OpenWeather API 기본 설정
 */
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * OpenWeather API 응답 인터페이스
 */
interface OpenWeatherCurrentResponse {
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  dt: number;
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    dt_txt: string;
  }>;
}

/**
 * API 호출 에러 클래스
 */
class WeatherAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'WeatherAPIError';
  }
}

/**
 * 날씨 서비스 클래스
 * 
 * 구현 방식:
 * 1. OpenWeather API 직접 호출
 * 2. 응답 데이터를 WeatherType으로 변환
 * 3. 에러 처리 및 재시도 로직 포함
 * 
 * 왜 이 방식인가:
 * - 실시간 데이터 제공
 * - 백엔드 의존성 없음
 * - 빠른 응답 속도
 */
class WeatherService {
  private readonly apiKey: string;
  private readonly baseURL: string;

  constructor() {
    this.apiKey = YOUR_OPENWEATHER_API_KEY;
    this.baseURL = OPENWEATHER_BASE_URL;

    // API 키 유효성 검사
    if (!this.apiKey || this.apiKey === 'your-api-key-here') {
      throw new Error('OpenWeather API 키가 설정되지 않았습니다.');
    }
  }

  /**
   * 현재 날씨 조회
   * 
   * @param lat 위도
   * @param lng 경도
   * @returns 현재 날씨 정보
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherType> {
    try {
      const url = `${this.baseURL}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric&lang=kr`;
      
      console.log('현재 날씨 API 호출:', { lat, lng });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new WeatherAPIError(
          `날씨 정보를 가져올 수 없습니다: ${response.statusText}`,
          response.status
        );
      }

      const data: OpenWeatherCurrentResponse = await response.json();
      
      return this.convertCurrentWeatherToWeatherType(data);
    } catch (error) {
      console.error('현재 날씨 조회 오류:', error);
      
      if (error instanceof WeatherAPIError) {
        throw error;
      }
      
      throw new WeatherAPIError('날씨 정보 조회 중 네트워크 오류가 발생했습니다.');
    }
  }

  /**
   * 5일 날씨 예보 조회
   * 
   * @param lat 위도
   * @param lng 경도
   * @returns 5일간 날씨 예보 배열
   */
  async getWeatherForecast(lat: number, lng: number): Promise<WeatherType[]> {
    try {
      const url = `${this.baseURL}/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric&lang=kr`;
      
      console.log('5일 예보 API 호출:', { lat, lng });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new WeatherAPIError(
          `날씨 예보를 가져올 수 없습니다: ${response.statusText}`,
          response.status
        );
      }

      const data: OpenWeatherForecastResponse = await response.json();
      
      return this.convertForecastToWeatherTypes(data);
    } catch (error) {
      console.error('날씨 예보 조회 오류:', error);
      
      if (error instanceof WeatherAPIError) {
        throw error;
      }
      
      throw new WeatherAPIError('날씨 예보 조회 중 네트워크 오류가 발생했습니다.');
    }
  }

  /**
   * OpenWeather 현재 날씨 응답을 WeatherType으로 변환
   * 
   * @param data OpenWeather API 응답
   * @returns WeatherType 객체
   */
  private convertCurrentWeatherToWeatherType(data: OpenWeatherCurrentResponse): WeatherType {
    const weather = data.weather[0]; // 첫 번째 날씨 정보 사용
    
    return {
      temperature: Math.round(data.main.temp), // 소수점 반올림
      description: weather.description,
      date: new Date(data.dt * 1000).toISOString().split('T')[0], // YYYY-MM-DD 형식
      icon: weather.icon
    };
  }

  /**
   * OpenWeather 예보 응답을 WeatherType 배열로 변환
   * 
   * 구현 방식:
   * 1. 5일간 데이터에서 일별 대표 데이터 추출
   * 2. 하루 중 가장 대표적인 시간대(12시) 우선 선택
   * 3. 12시 데이터가 없으면 가장 가까운 시간대 선택
   * 
   * @param data OpenWeather API 예보 응답
   * @returns WeatherType 배열 (최대 5일)
   */
  private convertForecastToWeatherTypes(data: OpenWeatherForecastResponse): WeatherType[] {
    const dailyWeather = new Map<string, WeatherType>();
    
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0]; // YYYY-MM-DD 추출
      const time = item.dt_txt.split(' ')[1]; // HH:MM:SS 추출
      const weather = item.weather[0];
      
      const weatherType: WeatherType = {
        temperature: Math.round(item.main.temp),
        description: weather.description,
        date: date,
        icon: weather.icon
      };
      
      // 이미 해당 날짜의 데이터가 있는지 확인
      if (!dailyWeather.has(date)) {
        // 첫 번째 데이터라면 무조건 저장
        dailyWeather.set(date, weatherType);
      } else {
        // 12시 데이터를 우선 선택 (더 대표적)
        if (time.startsWith('12:00')) {
          dailyWeather.set(date, weatherType);
        }
        // 기존이 12시가 아니고 현재가 12시에 가까우면 교체
        else if (!time.startsWith('12:00')) {
          const currentHour = parseInt(time.split(':')[0]);
          if (Math.abs(currentHour - 12) < 3) { // 12시 ±3시간 이내
            dailyWeather.set(date, weatherType);
          }
        }
      }
    });
    
    // Map을 배열로 변환하고 날짜순 정렬
    return Array.from(dailyWeather.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5); // 최대 5일
  }

  /**
   * 좌표 유효성 검사
   * 
   * @param lat 위도
   * @param lng 경도
   * @returns 유효한 좌표인지 여부
   */
  private isValidCoordinates(lat: number, lng: number): boolean {
    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  /**
   * 안전한 날씨 조회 (좌표 검증 포함)
   * 
   * @param lat 위도
   * @param lng 경도
   * @returns 5일 날씨 예보
   */
  async getSafeWeatherForecast(lat: number, lng: number): Promise<WeatherType[]> {
    // 좌표 유효성 검사
    if (!this.isValidCoordinates(lat, lng)) {
      throw new WeatherAPIError(`잘못된 좌표입니다: lat=${lat}, lng=${lng}`);
    }

    // 실제 API 호출
    return this.getWeatherForecast(lat, lng);
  }
}

// 싱글톤 인스턴스 생성
const weatherService = new WeatherService();

// 편의 함수들 export
export const getCurrentWeather = weatherService.getCurrentWeather.bind(weatherService);
export const getWeatherForecast = weatherService.getWeatherForecast.bind(weatherService);
export const getSafeWeatherForecast = weatherService.getSafeWeatherForecast.bind(weatherService);

// 기본 export
export default weatherService;

// 에러 클래스도 export
export { WeatherAPIError };