import { 
  TourType, 
  TravelPlanDto, 
  ScheduleItemDto,
  WeatherItemDto,
  PlanMetadataDto, 
  MapEntityType, 
  TrafficType, 
  LocationData, 
  VehicleData,
  WeatherType 
} from '../types/travel';

/**
 * 프론트엔드 레거시 데이터를 백엔드 호환 형식으로 변환하는 유틸리티
 */

/**
 * 프론트엔드 데이터를 백엔드 TravelPlanDto 형식으로 변환
 */
export const convertToTravelPlanDto = (
  schedules: ScheduleItemDto[],
  mapEntities: MapEntityType[],
  trafficData: TrafficType[],
  weatherData: WeatherType[] = []
): TravelPlanDto => {
  
  // 일정을 ScheduleItemDto 형식으로 변환
  const scheduleItems: ScheduleItemDto[] = schedules.map(schedule => {
    // 해당 일정의 장소 정보 찾기
    const mapEntity = mapEntities.find(entity => entity.scheduleId === schedule.scheduleId);
    
    // 해당 일정의 교통편 정보 찾기
    const traffic = trafficData.find(t => 
      t.departureTime === schedule.startTime && 
      t.arrivalTime === schedule.endTime
    );

    const scheduleItem: ScheduleItemDto = {
      scheduleId: schedule.scheduleId || '',
      tourId: schedule.tourId, 
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      title: schedule.title,
      content: schedule.content,
      memo: schedule.memo || '',
      types: mapEntity ? ['location'] : ['traffic'],
    };

    // 장소 데이터 변환
    if (mapEntity) {
      const locationData: LocationData = JSON.parse(mapEntity.location);
      scheduleItem.locationData = {
        name: locationData.name,
        address: locationData.address,
        coordinates: {
          lat: locationData.coordinates.lat,
          lng: locationData.coordinates.lng
        },
        rating: locationData.rating,
        googleMapLink: locationData.link
      };
    }

    // 교통편 데이터 변환
    if (traffic) {
      const vehicleData: VehicleData = JSON.parse(traffic.vehicle);
      scheduleItem.trafficData = {
        mode: vehicleData.mode,
        departure: vehicleData.departure,
        destination: vehicleData.destination,
        price: traffic.price,
        totalDuration: vehicleData.totalDuration,
        transfers: vehicleData.transfers
      };
    }

    return scheduleItem;
  });

  // 날씨 데이터 변환
  const weatherItems: WeatherItemDto[] = weatherData.map(weather => ({
    date: weather.date,
    temperature: weather.temperature,
    description: weather.description,
    icon: weather.icon || '01d'
  }));

  // 메타데이터 생성
  const metadata: PlanMetadataDto = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    totalDays: calculateTotalDays(schedules),
    estimatedBudget: calculateEstimatedBudget(schedules, trafficData)
  };

  return {
    schedules: scheduleItems,
    weatherData: weatherItems,
    metadata
  };
};

/**
 * 백엔드 TravelPlanDto를 프론트엔드 레거시 형식으로 변환
 */
export const convertFromTravelPlanDto = (
  planData: TravelPlanDto,
  tourId: number
): {
  schedules: ScheduleItemDto[];
  mapEntities: MapEntityType[];
  trafficData: TrafficType[];
  weatherData: WeatherType[];
} => {
  
  const schedules: ScheduleItemDto[] = [];
  const mapEntities: MapEntityType[] = [];
  const trafficData: TrafficType[] = [];

  planData.schedules.forEach((scheduleItem, index) => {
    const scheduleId = scheduleItem.scheduleId || `temp_${index + 1}`;  

    // 기본 일정 정보 변환
    const schedule: ScheduleItemDto = {
      scheduleId,
      tourId,
      title: scheduleItem.title,
      content: scheduleItem.content,
      date: scheduleItem.date,
      startTime: scheduleItem.startTime,
      endTime: scheduleItem.endTime,
      memo: scheduleItem.memo || ''
    };
    schedules.push(schedule);

    // 장소 정보가 있으면 MapEntity 생성
    if (scheduleItem.types?.includes('location') && scheduleItem.locationData) {
      const locationData: LocationData = {
        name: scheduleItem.locationData.name,
        address: scheduleItem.locationData.address,
        coordinates: {
          lat: scheduleItem.locationData.coordinates.lat,
          lng: scheduleItem.locationData.coordinates.lng
        },
        rating: scheduleItem.locationData.rating,
        link: scheduleItem.locationData.googleMapLink,
        placeId: `place_${scheduleId}`, // 임시 placeId
        photoUrl: undefined
      };

      const mapEntity: MapEntityType = {
        //mapId: scheduleId,
        scheduleId,
        tourId,
        location: JSON.stringify(locationData)
      };
      mapEntities.push(mapEntity);
    }

    // 교통편 정보가 있으면 TrafficType 생성
    if (scheduleItem.types?.includes('traffic') && scheduleItem.trafficData) {
      const vehicleData: VehicleData = {
        mode: 'TRANSIT',
        steps: [], // 실제 구현시 route step 정보 필요
        totalDuration: scheduleItem.trafficData.totalDuration,
        transfers: scheduleItem.trafficData.transfers,
        departure: scheduleItem.trafficData.departure,
        destination: scheduleItem.trafficData.destination
      };

      const traffic: TrafficType = {
        //trafficId,
        scheduleId,
        tourId,
        vehicle: JSON.stringify(vehicleData),
        spendTime: new Date().toISOString(),
        price: scheduleItem.trafficData.price,
        departureTime: scheduleItem.startTime,
        arrivalTime: scheduleItem.endTime,
        route: `${scheduleItem.trafficData.departure} → ${scheduleItem.trafficData.destination}`
      };
      trafficData.push(traffic);
    }
  });

  // 날씨 데이터 변환
  const weatherData: WeatherType[] = planData.weatherData.map(weather => ({
    temperature: weather.temperature,
    description: weather.description,
    date: weather.date,
    icon: weather.icon
  }));

  return {
    schedules,
    mapEntities,
    trafficData,
    weatherData
  };
};

/**
 * 프론트엔드 Tour 데이터를 백엔드 호환 형식으로 변환
 */
export const convertTourToBackendFormat = (
  tour: TourType,
  schedules: ScheduleItemDto[],
  mapEntities: MapEntityType[],
  trafficData: TrafficType[],
  weatherData: WeatherType[] = []
): TourType => {
  
  const planData = convertToTravelPlanDto(schedules, mapEntities, trafficData, weatherData);
  
  return {
    ...tour,
    planData,
    // 날짜 형식 확인 (백엔드는 YYYY-MM-DD 형식 기대)
    startDate: formatDateForBackend(tour.startDate),
    endDate: formatDateForBackend(tour.endDate)
  };
};

/**
 * 백엔드 Tour 데이터를 프론트엔드에서 사용할 수 있는 형식으로 변환
 */
export const convertTourFromBackendFormat = (
  backendTour: TourType
): {
  tour: TourType;
  schedules: ScheduleItemDto[];
  mapEntities: MapEntityType[];
  trafficData: TrafficType[];
  weatherData: WeatherType[];
} => {
  
  if (!backendTour.planData) {
    return {
      tour: backendTour,
      schedules: [],
      mapEntities: [],
      trafficData: [],
      weatherData: []
    };
  }

  const converted = convertFromTravelPlanDto(backendTour.planData, backendTour.tourId || 0);
  
  return {
    tour: {
      ...backendTour,
      planData: undefined // 프론트엔드에서는 분리해서 사용
    },
    ...converted
  };
};

/**
 * 날짜를 백엔드 형식으로 변환 (YYYY-MM-DD)
 */
export const formatDateForBackend = (date: string): string => {
  if (!date) return '';
  
  // 이미 YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Date 객체로 변환하여 형식 맞추기
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toISOString().split('T')[0];
};

/**
 * 총 여행 일수 계산
 */
const calculateTotalDays = (schedules: ScheduleItemDto[]): number => {
  if (schedules.length === 0) return 0;
  
  const dates = schedules.map(s => s.date).filter(Boolean);
  if (dates.length === 0) return 0;
  
  const uniqueDates = [...new Set(dates)];
  return uniqueDates.length;
};

/**
 * 예상 예산 계산
 */
const calculateEstimatedBudget = (schedules: ScheduleItemDto[], trafficData: TrafficType[]): number => {
  // 일정당 5만원 기준 + 교통비
  const scheduleBudget = schedules.length * 50000;
  const trafficBudget = trafficData.reduce((sum, traffic) => sum + traffic.price, 0);
  
  return scheduleBudget + trafficBudget;
};

/**
 * 현재 시간을 기본 시간으로 생성
 */
export const generateDefaultTimeSlot = (): { startTime: string; endTime: string } => {
  const now = new Date();
  const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2시간 후
  const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
  
  return { startTime, endTime: endTimeStr };
};
