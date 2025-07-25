// 백엔드 TourDto와 일치하는 구조
export interface TourType {
  tourId?: number;
  userId?: number;
  title: string;
  startDate: string; // YYYY-MM-DD 형식
  endDate: string;   // YYYY-MM-DD 형식
  travelers: number;
  budget: 'low' | 'medium' | 'high' | 'luxury';
  planData?: TravelPlanDto; // 통합된 계획 데이터
  createDate?: string;
  modifiedDate?: string;
}

// 백엔드 TravelPlanDto와 일치하는 구조
export interface TravelPlanDto {
  schedules: ScheduleItemDto[];
  weatherData: WeatherItemDto[];
  metadata: PlanMetadataDto;
}

// 백엔드 ScheduleItemDto와 일치하는 구조
export interface ScheduleItemDto {
  scheduleId: string;
  tourId: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  content: string;
  memo?: string; // 사용자 메모 추가
  types?: ('location' | 'traffic')[]; // location 또는 traffic
  locationData?: LocationDataDto;
  trafficData?: TrafficDataDto;
   // ⬇️ 프론트에서만 쓰는 필드 (백엔드 저장 안됨)
  order?: number;
}

// 백엔드 LocationDataDto와 일치하는 구조
export interface LocationDataDto {
  name: string;
  address: string;
  coordinates: CoordinatesDto;
  rating?: number;
  googleMapLink: string;
}

export interface CoordinatesDto {
  lat: number;
  lng: number;
}

// 백엔드 TrafficDataDto와 일치하는 구조
export interface TrafficDataDto {
  mode: string;
  departure: string;
  destination: string;
  price: number;
  totalDuration: string;
  transfers: number;
}

// 백엔드 WeatherItemDto와 일치하는 구조
export interface WeatherItemDto {
  date: string;
  temperature: number;
  description: string;
  icon: string;
}

// 백엔드 PlanMetadataDto와 일치하는 구조
export interface PlanMetadataDto {
  version: string;
  lastUpdated: string; // ISO datetime
  totalDays?: number;
  estimatedBudget?: number;
}

// ==== 기존 프론트엔드 전용 타입들 (호환성 유지) ====

// 프론트엔드에서만 사용하는 Schedule 타입 (레거시 호환)
export interface ScheduleType {
  scheduleId: string;
  tourId: number;
  title: string;
  content: string;
  date: string;
  startTime: string;
  endTime: string;
  memo?: string; // 사용자 메모 추가
  order?: number; // 드래그앤드롭 순서 관리용
}

// 프론트엔드에서만 사용하는 MapEntity 타입 (레거시 호환)
export interface MapEntityType {
  mapId?: number;
  scheduleId: string;
  tourId: number;
  location: string; // JSON 형태의 LocationData
}

// 프론트엔드에서만 사용하는 Traffic 타입 (레거시 호환)
export interface TrafficType {
  trafficId?: number;
  scheduleId: string;
  tourId: number;
  vehicle: string; // JSON 형태의 교통수단 상세 정보
  spendTime: string; // ISO datetime format
  price: number;
  departureTime: string;
  arrivalTime: string;
  route: string; // 경로 설명
}

// MapEntity.location 필드에 저장될 JSON 구조 (레거시 호환)
export interface LocationData {
  name: string;
  link: string; // Google Maps 공유 링크
  placeId: string;
  address: string;
  coordinates: { // 지도 표시용 좌표
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  rating?: number;
}

// Traffic.vehicle 필드에 저장될 JSON 구조 (레거시 호환)
export interface VehicleData {
  mode: 'TRANSIT';
  steps: RouteStep[];
  totalDuration: string;
  transfers: number;
  departure: string;
  destination: string;
}

export interface WeatherType {
  temperature: number;
  description: string;
  date: string;
  icon?: string;
}

export interface RouteResult {
  departure: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // 분 단위
  transfers: number;
  price: number;
  route: RouteStep[];
}

export interface RouteStep {
  mode: 'BUS' | 'SUBWAY' | 'TRAIN' | 'TRAM' | 'HEAVY_RAIL' | 'COMMUTER_TRAIN' | 'HIGH_SPEED_TRAIN' | 'WALKING';
  line: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
}


//pdf ts

// export interface PDFOptions {
//   date?: string;
// }

// export interface GeneratePDFParams {
//   tour: TourType;
//   schedules: ScheduleItemDto[];
//   options?: PDFOptions;
//   filename?: string;
// }



