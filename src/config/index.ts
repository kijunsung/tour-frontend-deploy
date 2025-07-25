// 환경 변수 설정 및 접근 유틸리티

interface EnvironmentConfig {
  googleMapsApiKey: string;
  openWeatherApiKey: string;
  apiBaseUrl: string;
  isDevelopment: boolean;
}

class ConfigManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = {
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
      isDevelopment: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
    };

    // 필수 환경 변수 검증
    this.validateConfig();
  }

  private validateConfig(): void {
    const missingKeys: string[] = [];

    if (!this.config.googleMapsApiKey) {
      missingKeys.push('VITE_GOOGLE_MAPS_API_KEY');
    }

    if (!this.config.openWeatherApiKey) {
      missingKeys.push('VITE_OPENWEATHER_API_KEY');
    }

    if (missingKeys.length > 0) {
      const message = `Missing required environment variables: ${missingKeys.join(', ')}`;
      
      if (this.config.isDevelopment) {
        console.warn(message);
        console.warn('Please create a .env file based on .env.example');
      } else {
        throw new Error(message);
      }
    }
  }

  public get googleMapsApiKey(): string {
    return this.config.googleMapsApiKey;
  }

  public get openWeatherApiKey(): string {
    return this.config.openWeatherApiKey;
  }

  public get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  public get isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  public get isProduction(): boolean {
    return !this.config.isDevelopment;
  }

  public getConfig(): Readonly<EnvironmentConfig> {
    return { ...this.config };
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const config = new ConfigManager();

// 개별 설정값들을 직접 내보내기 (편의성을 위해)
export const {
  googleMapsApiKey,
  openWeatherApiKey,
  apiBaseUrl,
  isDevelopment,
  isProduction
} = config;

// API 엔드포인트 상수들
export const API_ENDPOINTS = {
  // Tour 관련
  TOURS: '/tours',
  TOUR_BY_ID: (id: number) => `/tours/${id}`,
  
  // Schedule 관련
  SCHEDULES: '/schedules',
  SCHEDULES_BY_TOUR: (tourId: number) => `/schedules/tour/${tourId}`,
  SCHEDULE_BY_ID: (id: number) => `/schedules/${id}`,
  
  // MapEntity 관련
  MAP_ENTITIES: '/map-entities',
  MAP_ENTITIES_BY_SCHEDULE: (scheduleId: string) => `/map-entities/schedule/${scheduleId}`,
  MAP_ENTITY_BY_ID: (id: number) => `/map-entities/${id}`,
  
  // Traffic 관련
  TRAFFIC: '/traffic',
  TRAFFIC_BY_TOUR: (tourId: number) => `/traffic/tour/${tourId}`,
  TRAFFIC_BY_ID: (id: number) => `/traffic/${id}`,
  
  // Weather 관련
  WEATHER: '/weather',
  WEATHER_BY_TOUR: (tourId: number) => `/weather/tour/${tourId}`,
  WEATHER_BY_ID: (id: number) => `/weather/${id}`,
  
  // 사용자 관련
  USERS: '/users',
  USER_BY_ID: (id: number) => `/users/${id}`,
} as const;

// Google Maps 설정
export const GOOGLE_MAPS_CONFIG = {
  defaultCenter: {
    lat: 37.5665, // 서울시청
    lng: 126.9780
  },
  defaultZoom: 13,
  libraries: ['places', 'directions'] as const,
  language: 'ko',
  region: 'KR',
} as const;

// OpenWeather API 설정
export const OPENWEATHER_CONFIG = {
  baseUrl: 'https://api.openweathermap.org/data/2.5',
  units: 'metric', // 섭씨 온도
  lang: 'kr', // 한국어
  iconBaseUrl: 'https://openweathermap.org/img/wn',
} as const;

// 애플리케이션 상수들
export const APP_CONSTANTS = {
  // 일정 관련
  DEFAULT_SCHEDULE_DURATION: 120, // 2시간 (분 단위)
  MIN_SCHEDULE_DURATION: 30, // 30분
  MAX_SCHEDULE_DURATION: 480, // 8시간
  
  // 검색 관련
  MAX_SEARCH_RESULTS: 10,
  MAX_ROUTE_RESULTS: 5,
  
  // 캐시 관련
  WEATHER_CACHE_DURATION: 30 * 60 * 1000, // 30분
  PLACES_CACHE_DURATION: 60 * 60 * 1000, // 1시간
  
  // UI 관련
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  
  // 로컬 스토리지 키들
  STORAGE_KEYS: {
    TEMP_TOUR: 'travel_temp_tour',
    TEMP_SCHEDULES: 'travel_temp_schedules',
    USER_PREFERENCES: 'travel_user_preferences',
    RECENT_SEARCHES: 'travel_recent_searches',
  }
} as const;

export default config;
