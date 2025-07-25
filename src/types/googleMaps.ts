// Google Maps API 관련 타입 정의

// 기본 지도 설정
export const DEFAULT_MAP_CONFIG = {
  center: {
    lat: 37.5665, // 서울 시청 기준
    lng: 126.9780
  },
  zoom: 13
} as const;

// Google Places Autocomplete 기본 옵션
export const DEFAULT_AUTOCOMPLETE_OPTIONS = {
  strictBounds: false,
  types: ['establishment', 'geocode'],
  componentRestrictions: { country: 'kr' }, // 한국으로 제한
  fields: [
    'place_id',
    'name',
    'formatted_address',
    'geometry',
    'photos',
    'rating',
    'types'
  ] 
};

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: google.maps.places.PlacePhoto[];
  rating?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  types: string[];
  website?: string;
  international_phone_number?: string;
}

export interface GoogleDirectionsResult {
  routes: google.maps.DirectionsRoute[];
  status: google.maps.DirectionsStatus;
}

export interface PlaceSearchRequest {
  query: string;
  fields: string[];
  bounds?: google.maps.LatLngBounds;
  locationBias?: google.maps.LatLng;
}

export interface RouteRequest {
  origin: string | google.maps.LatLng;
  destination: string | google.maps.LatLng;
  travelMode: google.maps.TravelMode;
  transitOptions?: google.maps.TransitOptions;
  departureTime?: Date;
  arrivalTime?: Date;
}

// 검색 결과 상태 관리용 타입
export interface SearchState {
  isLoading: boolean;
  results: GooglePlaceResult[];
  selectedPlace: GooglePlaceResult | null;
  error: string | null;
}

// 경로 찾기 상태 관리용 타입
export interface RouteState {
  isLoading: boolean;
  routes: google.maps.DirectionsRoute[];
  selectedRoute: google.maps.DirectionsRoute | null;
  error: string | null;
}

// 지도 상태 관리용 타입
export interface MapState {
  center: google.maps.LatLng;
  zoom: number;
  markers: google.maps.Marker[];
  infoWindows: google.maps.InfoWindow[];
}
