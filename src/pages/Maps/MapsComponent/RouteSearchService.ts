// Google Directions API 연동 서비스
import { LocationData, RouteResult, RouteStep } from '../../../types/travel';

/**
 * 길찾기 요청 인터페이스
 */
export interface RouteRequest {
  departure: LocationData;
  destination: LocationData;
  departureTime?: Date;
  arrivalTime?: Date; // 도착 시간 옵션 추가
  travelMode?: google.maps.TravelMode;
}

/**
 * Google Directions Service를 사용한 길찾기 검색
 * 
 * 구현 이유:
 * 1. placeId 기반 검색으로 정확성 향상
 * 2. 대중교통 전용 모드로 여행 계획에 특화
 * 3. 여러 경로 옵션 제공으로 선택권 확대
 * 
 * 왜 이 방식인가:
 * - Google Routes API v2는 복잡하고 비싸므로 Directions API 사용
 * - placeId 사용으로 모호성 제거 (예: "강남역"이 여러 개 있을 때)
 * - TRANSIT 모드로 대중교통 정보만 검색
 */
export const searchTransitRoutes = async (request: RouteRequest): Promise<RouteResult[]> => {
  return new Promise((resolve, reject) => {
    const directionsService = new google.maps.DirectionsService();
    
    // 현재 위치 판별 (placeId가 'current_location_'로 시작하는 경우)
    const isDepartureCurrentLocation = request.departure.placeId.startsWith('current_location_');
    const isDestinationCurrentLocation = request.destination.placeId.startsWith('current_location_');
    
    // origin 설정: 현재 위치면 좌표, 아니면 placeId 사용
    const origin = isDepartureCurrentLocation 
      ? { lat: request.departure.coordinates.lat, lng: request.departure.coordinates.lng }
      : { placeId: request.departure.placeId };
      
    // destination 설정: 현재 위치면 좌표, 아니면 placeId 사용  
    const destination = isDestinationCurrentLocation
      ? { lat: request.destination.coordinates.lat, lng: request.destination.coordinates.lng }
      : { placeId: request.destination.placeId };
    
    const directionsRequest: google.maps.DirectionsRequest = {
      origin,
      destination,
      
      // 대중교통 모드만 사용
      travelMode: google.maps.TravelMode.TRANSIT,
      
      // 대중교통 옵션
      transitOptions: {
        // 도착 시간이 지정된 경우 arrivalTime 사용, 그렇지 않으면 departureTime 사용
        ...(request.arrivalTime 
          ? { arrivalTime: request.arrivalTime }
          : { departureTime: request.departureTime || new Date() }
        ),
        modes: [
          google.maps.TransitMode.BUS,
          google.maps.TransitMode.SUBWAY,
          google.maps.TransitMode.TRAIN
        ],
        routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
      },
      
      // 여러 경로 옵션 요청
      provideRouteAlternatives: true
    };

    console.log('Directions 요청:', {
      origin,
      destination,
      isDepartureCurrentLocation,
      isDestinationCurrentLocation
    });

    directionsService.route(directionsRequest, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        try {
          const routes = parseDirectionsResult(result, request);
          console.log('길찾기 성공:', routes);
          resolve(routes);
        } catch (error) {
          console.error('경로 파싱 오류:', error);
          reject(new Error('경로 정보 처리 중 오류가 발생했습니다.'));
        }
      } else {
        console.error('Directions API 오류:', status);
        reject(new Error(getDirectionsErrorMessage(status)));
      }
    });
  });
};

/**
 * Google Directions 결과를 RouteResult로 변환
 * 
 * 구현 방식:
 * 1. 각 route를 분석하여 RouteResult로 변환
 * 2. 대중교통 단계별 정보 추출 (지하철, 버스 등)
 * 3. 소요시간, 환승횟수, 예상 요금 계산
 */
const parseDirectionsResult = (
  result: google.maps.DirectionsResult, 
  request: RouteRequest
): RouteResult[] => {
  const routes: RouteResult[] = [];
  
  result.routes.forEach((route, index) => {
    try {
      const leg = route.legs[0]; // 경유지가 없으므로 첫 번째 leg만 사용
      
      if (!leg) return;

      // 기본 정보 추출
      const duration = leg.duration?.value || 0; // 초 단위
      const durationMinutes = Math.round(duration / 60);
      
      // 출발/도착 시간 계산
      const departureTime = leg.departure_time?.text || 
        formatTime(request.departureTime || new Date());
      const arrivalTime = leg.arrival_time?.text || 
        formatTime(new Date(Date.now() + duration * 1000));

      // 대중교통 단계 파싱
      const routeSteps = parseTransitSteps(leg.steps);
      
      // 환승 횟수 계산 (대중교통 단계 - 1)
      const transitSteps = routeSteps.filter(step => 
        step.mode === 'BUS' || 
        step.mode === 'SUBWAY' || 
        step.mode === 'TRAIN' ||
        step.mode === 'HEAVY_RAIL' ||
        step.mode === 'COMMUTER_TRAIN' ||
        step.mode === 'HIGH_SPEED_TRAIN' ||
        step.mode === 'TRAM'
      );
      const transfers = Math.max(0, transitSteps.length - 1);

      // 예상 요금 계산 (한국 기준 추정)
      const estimatedPrice = calculateEstimatedFare(routeSteps);

      const routeResult: RouteResult = {
        departure: request.departure.name,
        destination: request.destination.name,
        departureTime,
        arrivalTime,
        duration: durationMinutes,
        transfers,
        price: estimatedPrice,
        route: routeSteps
      };

      routes.push(routeResult);
    } catch (error) {
      console.error(`Route ${index} 파싱 오류:`, error);
      // 개별 경로 오류는 무시하고 계속 진행
    }
  });

  return routes;
};

/**
 * 대중교통 단계 파싱
 * 
 * 구현 이유:
 * - Google의 단계별 정보를 우리 RouteStep 형식으로 변환
 * - 지하철/버스/기차 구분하여 사용자에게 명확한 정보 제공
 */
const parseTransitSteps = (steps: google.maps.DirectionsStep[]): RouteStep[] => {
  const routeSteps: RouteStep[] = [];

  steps.forEach(step => {
    if (step.travel_mode === google.maps.TravelMode.TRANSIT && step.transit) {
      const transit = step.transit;
      const line = transit.line;
      
      // 교통수단 타입 결정 (더 상세한 분류)
      let mode: 'BUS' | 'SUBWAY' | 'TRAIN' | 'TRAM' | 'HEAVY_RAIL' | 'COMMUTER_TRAIN' | 'HIGH_SPEED_TRAIN' | 'WALKING' = 'BUS';
      
      if (line?.vehicle?.type) {
        switch (line.vehicle.type) {
          case google.maps.VehicleType.SUBWAY:
          case google.maps.VehicleType.METRO_RAIL:
            mode = 'SUBWAY';
            break;
          case google.maps.VehicleType.HEAVY_RAIL:
            mode = 'HEAVY_RAIL'; // 일반 기차
            break;
          case google.maps.VehicleType.COMMUTER_TRAIN:
            mode = 'COMMUTER_TRAIN'; // 통근열차
            break;
          case google.maps.VehicleType.HIGH_SPEED_TRAIN:
            mode = 'HIGH_SPEED_TRAIN'; // 고속철도 (KTX 등)
            break;
          case google.maps.VehicleType.BUS:
            mode = 'BUS';
            break;
          case google.maps.VehicleType.TRAM:
            mode = 'TRAM'; // 전차
            break;
          default:
            mode = 'BUS'; // 기본값
        }
      }

      const routeStep: RouteStep = {
        mode,
        line: line?.short_name || line?.name || '정보없음',
        departure: transit.departure_stop?.name || '출발지',
        arrival: transit.arrival_stop?.name || '도착지', 
        departureTime: transit.departure_time?.text || '',
        arrivalTime: transit.arrival_time?.text || ''
      };

      routeSteps.push(routeStep);
    }
  });

  return routeSteps;
};

/**
 * 예상 요금 계산 (한국 기준)
 * 
 * 계산 방식:
 * - 지하철: 기본요금 1370원 (카드 기준)
 * - 버스: 기본요금 1200원 (카드 기준)  
 * - 환승: 추가 요금 없음 (한국 환승 시스템)
 * 
 * 주의: Google API에서 정확한 요금을 제공하지 않으므로 추정값
 */
const calculateEstimatedFare = (steps: RouteStep[]): number => {
  if (steps.length === 0) return 0;

  // 한국 대중교통 기본요금 (카드 기준, 2024년 기준)
  const SUBWAY_BASE_FARE = 1370;
  const BUS_BASE_FARE = 1200;
  
  // 사용된 교통수단 확인
  const hasSubway = steps.some(step => step.mode === 'SUBWAY');
  const hasBus = steps.some(step => step.mode === 'BUS');
  const hasTrain = steps.some(step => 
    step.mode === 'TRAIN' || 
    step.mode === 'HEAVY_RAIL' || 
    step.mode === 'COMMUTER_TRAIN' || 
    step.mode === 'HIGH_SPEED_TRAIN'
  );
  
  // 한국 환승 시스템: 첫 번째 교통수단 요금만 적용
  if ((hasSubway || hasTrain) && hasBus) {
    // 지하철/기차 + 버스 조합: 높은 요금 적용
    return Math.max(SUBWAY_BASE_FARE, BUS_BASE_FARE);
  } else if (hasSubway || hasTrain) {
    return SUBWAY_BASE_FARE; // 지하철/기차 동일 요금
  } else if (hasBus) {
    return BUS_BASE_FARE;
  }
  
  return 0;
};

/**
 * 시간 포맷팅 (HH:MM 형식)
 */
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Directions API 오류 메시지 변환
 */
const getDirectionsErrorMessage = (status: google.maps.DirectionsStatus): string => {
  switch (status) {
    case google.maps.DirectionsStatus.NOT_FOUND:
      return '경로를 찾을 수 없습니다. 출발지나 목적지를 확인해주세요.';
    case google.maps.DirectionsStatus.ZERO_RESULTS:
      return '해당 경로에 대한 대중교통 정보가 없습니다.';
    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
      return '일일 검색 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
    case google.maps.DirectionsStatus.REQUEST_DENIED:
      return '길찾기 서비스 접근이 거부되었습니다.';
    case google.maps.DirectionsStatus.INVALID_REQUEST:
      return '잘못된 검색 요청입니다. 출발지와 목적지를 다시 확인해주세요.';
    case google.maps.DirectionsStatus.UNKNOWN_ERROR:
      return '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.';
    default:
      return '길찾기 중 오류가 발생했습니다.';
  }
};
