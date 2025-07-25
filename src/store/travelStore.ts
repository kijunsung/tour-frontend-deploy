import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  TourType,
  ScheduleItemDto,
  MapEntityType,
  TrafficType,
  WeatherType,
  RouteResult,
  LocationData,
} from '../types/travel';
import { GooglePlaceResult } from '../types/googleMaps';
import { convertTourToBackendFormat, convertTourFromBackendFormat } from '../utils/tourDataConverter';
import { tourAPI } from '../services/tourApi';

// 날짜 범위 생성 유틸리티 함수
const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
};

interface TravelState {
  // 현재 여행 정보
  currentTour: TourType | null;
  
  // 일정 관련
  schedules:  ScheduleItemDto[];
  mapEntities: MapEntityType[];
  trafficData: TrafficType[];
  
  // 날짜 기반 탭 관리 (새로 추가)
  availableDates: string[]; // 시작일~종료일 범위의 모든 날짜
  selectedDate: string; // 현재 선택된 날짜
  
  // 지도 관련
  selectedLocation: GooglePlaceResult | null;
  routeResults: RouteResult[];
  isRoutePanelOpen: boolean;
  // 지도 포커스 제어 (새로 추가)
  mapFocusLocation: LocationData | null; // 지도에서 포커스할 위치
  
  // 날씨 정보
  weatherData: WeatherType[];
  
  // UI 상태
  selectedDayIndex: number;
  isLoading: boolean;
  error: string | null;
}

interface TravelActions {
  // Tour 관련 액션
  setCurrentTour: (tour: TourType) => void;
  updateTourInfo: (tourInfo: Partial<TourType>) => void;
  clearCurrentTour: () => void;
  resetTourInfo: () => void;
  
  // 날짜 기반 탭 관리 (새로 추가)
  generateAvailableDates: () => void; // 시작일~종료일 범위 날짜 생성
  setSelectedDate: (date: string) => void;
  addNextDate: () => void; // 다음 날짜 추가
  
  // Schedule 관련 액션
  addSchedule: (schedule: Omit<ScheduleItemDto, 'scheduleId'>) => void;
  updateSchedule: (scheduleId: string, updates: Partial<ScheduleItemDto>) => void;
  removeSchedule: (scheduleId: string) => void;
  reorderSchedules: (date: string, reorderedSchedules: ScheduleItemDto[]) => void; // 드래그앤드롭용
  
  // MapEntity 관련 액션
  addLocationToSchedule: (location: LocationData, scheduleData?: Partial<ScheduleItemDto>) => void;
  removeMapEntity: (mapId: number) => void;
  updateMapEntity: (mapId: number, updates: Partial<MapEntityType>) => void;
  
  // Traffic 관련 액션
  addRouteToSchedule: (route: RouteResult, scheduleData?: Partial<ScheduleItemDto>) => void;
  removeTraffic: (trafficId: number) => void;
  
  // 지도 관련 액션
  setSelectedLocation: (location: GooglePlaceResult | null) => void;
  setRouteResults: (results: RouteResult[]) => void;
  toggleRoutePanel: () => void;
  setRoutePanelOpen: (isOpen: boolean) => void;
  // 지도 위치 제어 (새로 추가)
  focusMapOnLocation: (location: LocationData) => void;
  clearMapFocus: () => void;
  
  // 날씨 관련 액션
  setWeatherData: (weatherData: WeatherType[]) => void;
  
  // UI 상태 액션
  setSelectedDayIndex: (index: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 데이터 초기화
  resetTravelData: () => void;
  
  // 테스트용 샘플 데이터 로드
  loadSampleData: () => void;
  
  // 백엔드 연동 액션들
  saveTourToBackend: () => Promise<TourType | null>;
  loadTourFromBackend: (tourId: number) => Promise<void>;
  loadUserToursFromBackend: (userId: number) => Promise<TourType[]>;
  createNewTourInBackend: (userId: number) => Promise<TourType | null>;
}

// // 샘플 데이터
// const sampleData = {
//   tour: {
//     tourId: 1,
//     title: "서울 2박 3일 여행",
//     startDate: "2025-07-15",
//     endDate: "2025-07-17",
//     travelers: 2,
//     budget: 'medium' as const
//   },
//   schedules: [
//     {
//       scheduleId: "1",
//       tourId: 1,
//       title: "경복궁 관람",
//       content: "조선 왕조의 정궁, 근정전과 경회루 관람",
//       date: "2025-07-15",
//       startTime: "09:00",
//       endTime: "11:00",
//       memo: "예전 메모 예시"
//     },
//     {
//       scheduleId: "2",
//       tourId: 1,
//       title: "지하철 3호선 이용",
//       content: "경복궁역 → 안국역, 5분 소요",
//       date: "2025-07-15",
//       startTime: "11:15",
//       endTime: "11:20",
//       memo: "예전 메모 예시"
//     },
//     {
//       scheduleId: "3",
//       tourId: 1,
//       title: "북촌한옥마을 산책",
//       content: "전통 한옥의 아름다움과 서울 전경 감상",
//       date: "2025-07-15",
//       startTime: "11:30",
//       endTime: "13:00",
//       memo: "예전 메모 예시"
//     },
//     {
//       scheduleId: "4",
//       tourId: 1,
//       title: "명동 맛집 탐방",
//       content: "명동교자 본점에서 만두 점심",
//       date: "2025-07-15",
//       startTime: "14:00",
//       endTime: "15:30",
//       memo: "예전 메모 예시"
//     },
//     {
//       scheduleId: "5",
//       tourId: 1,
//       title: "남산타워 관광",
//       content: "서울의 야경 감상",
//       date: "2025-07-15",
//       startTime: "18:00",
//       endTime: "20:00",
//       memo: "예전 메모 예시"
//     }
//   ],
//   mapEntities: [
//     {
//       mapId: 1,
//       scheduleId: "1",
//       tourId: 1,
//       location: JSON.stringify({
//         name: "경복궁",
//         address: "서울특별시 종로구 사직로 161",
//         coordinates: { lat: 37.5796, lng: 126.9770 },
//         placeId: "ChIJzRz3K2WIFTER4Dl0Zw8Uy6E",
//         link: "https://maps.google.com/?cid=경복궁",
//         rating: 4.3,
//         photoUrl: "https://example.com/photo1.jpg"
//       })
//     },
//     {
//       mapId: 3,
//       scheduleId: "3",
//       tourId: 1,
//       location: JSON.stringify({
//         name: "북촌한옥마을",
//         address: "서울특별시 종로구 계동길 37",
//         coordinates: { lat: 37.5816, lng: 126.9839 },
//         placeId: "ChIJ12345example",
//         link: "https://maps.google.com/?cid=북촌한옥마을",
//         rating: 4.1,
//         photoUrl: "https://example.com/photo2.jpg"
//       })
//     },
//     {
//       mapId: 4,
//       scheduleId: "4",
//       tourId: 1,
//       location: JSON.stringify({
//         name: "명동교자 본점",
//         address: "서울특별시 중구 명동10길 29",
//         coordinates: { lat: 37.5618, lng: 126.9852 },
//         placeId: "ChIJ67890example",
//         link: "https://maps.google.com/?cid=명동교자",
//         rating: 4.0,
//         photoUrl: "https://example.com/photo3.jpg"
//       })
//     },
//     {
//       mapId: 5,
//       scheduleId: "5",
//       tourId: 1,
//       location: JSON.stringify({
//         name: "N서울타워",
//         address: "서울특별시 용산구 남산공원길 105",
//         coordinates: { lat: 37.5512, lng: 126.9882 },
//         placeId: "ChIJabcdefexample",
//         link: "https://maps.google.com/?cid=남산타워",
//         rating: 4.2,
//         photoUrl: "https://example.com/photo4.jpg"
//       })
//     }
//   ],
//   trafficData: [
//     {
//       trafficId: 2,
//       tourId: 1,
//       vehicle: JSON.stringify({
//         mode: 'TRANSIT',
//         steps: [
//           {
//             mode: 'SUBWAY',
//             line: '지하철 3호선',
//             departure: '경복궁역',
//             arrival: '안국역',
//             departureTime: '11:15',
//             arrivalTime: '11:20'
//           }
//         ],
//         totalDuration: '5분',
//         transfers: 0,
//         departure: '경복궁역',
//         destination: '안국역'
//       }),
//       spendTime: '2025-07-15T11:15:00.000Z',
//       price: 1500,
//       departureTime: '11:15',
//       arrivalTime: '11:20',
//       route: '지하철 3호선 (경복궁역 → 안국역)'
//     }
//   ]
// };

// 초기 상태
const initialState: TravelState = {
  currentTour: null,
  schedules: [],
  mapEntities: [],
  trafficData: [],
  // 날짜 관리 초기화
  availableDates: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedLocation: null,
  routeResults: [],
  isRoutePanelOpen: false,
  // 지도 포커스 초기화
  mapFocusLocation: null,
  weatherData: [],
  selectedDayIndex: 0,
  isLoading: false,
  error: null,
};

// Zustand Store 생성
export const useTravelStore = create<TravelState & TravelActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Tour 관련 액션
      setCurrentTour: (tour) => 
        set({ currentTour: tour }, false, 'setCurrentTour'),

      updateTourInfo: (tourInfo) =>
        set(
          (state) => {
            const updatedTour = state.currentTour
              ? { ...state.currentTour, ...tourInfo }
              : { 
                  title: '',
                  startDate: '',
                  endDate: '',
                  travelers: 2,
                  budget: 'medium' as const,
                  ...tourInfo 
                };
            
            // 날짜 변경 시 자동으로 사용 가능한 날짜 업데이트
            let newAvailableDates = state.availableDates;
            let newSelectedDate = state.selectedDate;
            
            if (tourInfo.startDate || tourInfo.endDate) {
              const startDate = tourInfo.startDate || updatedTour.startDate;
              const endDate = tourInfo.endDate || updatedTour.endDate;
              
              if (startDate && endDate && startDate <= endDate) {
                newAvailableDates = generateDateRange(startDate, endDate);
                // 현재 선택된 날짜가 새 범위에 없으면 첫 번째 날짜로 설정
                if (!newAvailableDates.includes(newSelectedDate)) {
                  newSelectedDate = newAvailableDates[0] || new Date().toISOString().split('T')[0];
                }
              }
            }
            
            return {
              currentTour: updatedTour,
              availableDates: newAvailableDates,
              selectedDate: newSelectedDate
            };
          },
          false,
          'updateTourInfo'
        ),

      clearCurrentTour: () => 
        set({ currentTour: null }, false, 'clearCurrentTour'),

      resetTourInfo: () =>
        set({ 
          currentTour: {
            title: '',
            startDate: '',
            endDate: '',
            travelers: 2,
            budget: 'medium'
          },
          availableDates: [],
          selectedDate: new Date().toISOString().split('T')[0]
        }, false, 'resetTourInfo'),

      // 날짜 기반 탭 관리 액션들
      generateAvailableDates: () =>
        set(
          (state) => {
            if (!state.currentTour?.startDate || !state.currentTour?.endDate) {
              return { availableDates: [] };
            }
            
            const dates = generateDateRange(state.currentTour.startDate, state.currentTour.endDate);
            const newSelectedDate = dates.includes(state.selectedDate) 
              ? state.selectedDate 
              : dates[0] || new Date().toISOString().split('T')[0];
              
            return {
              availableDates: dates,
              selectedDate: newSelectedDate
            };
          },
          false,
          'generateAvailableDates'
        ),

      setSelectedDate: (date) =>
        set({ selectedDate: date }, false, 'setSelectedDate'),

      addNextDate: () =>
        set(
          (state) => {
            if (!state.currentTour?.startDate || !state.currentTour?.endDate) {
              return {}; // 아무 변경 없음
            }
            
            const currentDates = state.availableDates;
            const endDate = new Date(state.currentTour.endDate);
            
            if (currentDates.length === 0) {
              // 첫 번째 날짜 추가: 시작일
              const newDate = state.currentTour.startDate;
              return {
                availableDates: [newDate],
                selectedDate: newDate
              };
            }
            
            // 마지막 날짜 다음 날 추가
            const lastDate = new Date(currentDates[currentDates.length - 1]);
            const nextDay = new Date(lastDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            // 종료일을 초과하지 않는 경우만 추가
            if (nextDay <= endDate) {
              const newDateStr = nextDay.toISOString().split('T')[0];
              return {
                availableDates: [...currentDates, newDateStr],
                selectedDate: newDateStr
              };
            }
            
            return {}; // 더 이상 추가할 수 없음
          },
          false,
          'addNextDate'
        ),

      // Schedule 관련 액션
      addSchedule: (schedule) => {
        set(
          (state) => {
            // 해당 날짜의 기존 일정 개수를 확인하여 order 값 설정
            const sameDateSchedules = state.schedules.filter(s => s.date === schedule.date);
            const nextOrder = sameDateSchedules.length;
            
            const newSchedule:  ScheduleItemDto = {
              ...schedule,
              scheduleId: Date.now().toString(), // 임시 ID, 실제로는 서버에서 받아옴
              order: nextOrder // 마지막 순서로 추가
            };
            
            return {
              schedules: [...state.schedules, newSchedule],
            };
          },
          false,
          'addSchedule'
        );
      },

      updateSchedule: (scheduleId, updates) =>
        set(
          (state) => ({
            schedules: state.schedules.map((schedule) =>
              schedule.scheduleId === scheduleId
                ? { ...schedule, ...updates }
                : schedule
            ),
          }),
          false,
          'updateSchedule'
        ),

      removeSchedule: (scheduleId) =>
        set(
          (state) => ({
            schedules: state.schedules.filter(
              (schedule) => schedule.scheduleId !== scheduleId
            ),
            mapEntities: state.mapEntities.filter(
              (entity) => entity.scheduleId !== scheduleId
            ),
          }),
          false,
          'removeSchedule'
        ),

      // 드래그앤드롭으로 일정 순서 변경
      reorderSchedules: (date, reorderedSchedules) =>
        set(
          (state) => {
            // 다른 날짜의 일정은 유지하고, 해당 날짜의 일정만 교체
            const otherDateSchedules = state.schedules.filter(
              (schedule) => schedule.date !== date
            );
            
            return {
              schedules: [...otherDateSchedules, ...reorderedSchedules]
            };
          },
          false,
          'reorderSchedules'
        ),

      // MapEntity 관련 액션
      addLocationToSchedule: (location, scheduleData = {}) => {
        let currentTour = get().currentTour;
        const { selectedDate, schedules } = get();
        
        // currentTour가 없으면 기본 투어 생성
        if (!currentTour) {
          const defaultTour: TourType = {
            tourId: Date.now(),
            title: "나의 여행 계획",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7일 후
            travelers: 2,
            budget: 'medium'
          };
          
          // 기본 투어 설정
          set({ currentTour: defaultTour }, false, 'setDefaultTour');
          currentTour = defaultTour;
          
          console.log('기본 투어 자동 생성:', defaultTour);
        }

        // 기본 시간 설정 (현재 시각기준)
        const now = new Date();
        const defaultStartTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 해당 날짜의 기존 일정 개수를 확인하여 order 값 설정
        const sameDateSchedules = schedules.filter(s => s.date === selectedDate);
        const nextOrder = sameDateSchedules.length;

        // Schedule 생성 - 선택된 날짜 기준
        const newSchedule:  ScheduleItemDto = {
          scheduleId: Date.now().toString(),
          tourId: currentTour.tourId!,
          title: location.name,
          content: location.address,
          date: selectedDate, // 현재 선택된 날짜 사용
          startTime: defaultStartTime, // 시작시간만 저장
          endTime: '', // 사용하지 않음
          order: nextOrder, // 마지막 순서로 추가
          ...scheduleData,
        };

        // MapEntity 생성 - LocationData를 JSON으로 저장
        const newMapEntity: MapEntityType = {
          mapId: Date.now() + 1,
          scheduleId: newSchedule.scheduleId!,
          tourId: currentTour.tourId!,
          location: JSON.stringify(location), // LocationData 전체를 JSON으로 저장
        };

        console.log('일정 추가 - Schedule:', newSchedule);
        console.log('일정 추가 - MapEntity:', newMapEntity);

        set(
          (state) => ({
            schedules: [...state.schedules, newSchedule],
            mapEntities: [...state.mapEntities, newMapEntity],
          }),
          false,
          'addLocationToSchedule'
        );
      },

      removeMapEntity: (mapId) =>
        set(
          (state) => ({
            mapEntities: state.mapEntities.filter(
              (entity) => entity.mapId !== mapId
            ),
          }),
          false,
          'removeMapEntity'
        ),

      updateMapEntity: (mapId, updates) =>
        set(
          (state) => ({
            mapEntities: state.mapEntities.map((entity) =>
              entity.mapId === mapId ? { ...entity, ...updates } : entity
            ),
          }),
          false,
          'updateMapEntity'
        ),

      // Traffic 관련 액션
      addRouteToSchedule: (route, scheduleData = {}) => {
        let currentTour = get().currentTour;
        const { selectedDate, schedules } = get();
        
        // currentTour가 없으면 기본 투어 생성
        if (!currentTour) {
          const defaultTour: TourType = {
            tourId: Date.now(),
            title: "나의 여행 계획",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            travelers: 2,
            budget: 'medium'
          };
          
          set({ currentTour: defaultTour }, false, 'setDefaultTour');
          currentTour = defaultTour;
          
          console.log('기본 투어 자동 생성 (교통편):', defaultTour);
        }
        
        // 해당 날짜의 기존 일정 개수를 확인하여 order 값 설정
        const sameDateSchedules = schedules.filter(s => s.date === selectedDate);
        const nextOrder = sameDateSchedules.length;

        // Schedule 생성 - 선택된 날짜 기준
        const newSchedule:  ScheduleItemDto = {
          scheduleId: Date.now().toString(),
          tourId: currentTour.tourId!,
          title: `🚇 ${route.departure} → ${route.destination}`,
          content: `${route.duration}분 소요, 환승 ${route.transfers}회`,
          date: selectedDate,
          startTime: route.departureTime,
          endTime: '',
          order: nextOrder, // 마지막 순서로 추가
          ...scheduleData,
        };

        // Traffic 생성
        const vehicleData = {
          mode: 'TRANSIT',
          steps: route.route,
          totalDuration: `${route.duration}분`,
          transfers: route.transfers,
          departure: route.departure,
          destination: route.destination,
        };

        const newTraffic: TrafficType = {
          trafficId: Date.now() + 1,
          scheduleId: "",
          tourId: currentTour.tourId!,
          vehicle: JSON.stringify(vehicleData),
          spendTime: new Date().toISOString(),
          price: route.price || 0,
          departureTime: route.departureTime,
          arrivalTime: route.arrivalTime,
          route: route.route.map(step => `${step.line} (${step.departure} → ${step.arrival})`).join(', '),
        };

        console.log('교통편 추가 - Schedule:', newSchedule);
        console.log('교통편 추가 - Traffic:', newTraffic);

        set(
          (state) => ({
            schedules: [...state.schedules, newSchedule],
            trafficData: [...state.trafficData, newTraffic],
          }),
          false,
          'addRouteToSchedule'
        );
      },

      removeTraffic: (trafficId) =>
        set(
          (state) => ({
            trafficData: state.trafficData.filter(
              (traffic) => traffic.trafficId !== trafficId
            ),
          }),
          false,
          'removeTraffic'
        ),

      // 지도 관련 액션
      setSelectedLocation: (location) =>
        set({ selectedLocation: location }, false, 'setSelectedLocation'),

      setRouteResults: (results) =>
        set({ routeResults: results }, false, 'setRouteResults'),

      toggleRoutePanel: () =>
        set(
          (state) => ({ isRoutePanelOpen: !state.isRoutePanelOpen }),
          false,
          'toggleRoutePanel'
        ),

      setRoutePanelOpen: (isOpen) =>
        set({ isRoutePanelOpen: isOpen }, false, 'setRoutePanelOpen'),

      // 지도 포커스 제어 액션들
      focusMapOnLocation: (location) =>
        set({ mapFocusLocation: location }, false, 'focusMapOnLocation'),

      clearMapFocus: () =>
        set({ mapFocusLocation: null }, false, 'clearMapFocus'),

      // 날씨 관련 액션
      setWeatherData: (weatherData) =>
        set({ weatherData }, false, 'setWeatherData'),

      // UI 상태 액션
      setSelectedDayIndex: (index) =>
        set({ selectedDayIndex: index }, false, 'setSelectedDayIndex'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      // 데이터 초기화
      resetTravelData: () =>
        set(
          {
            ...initialState,
          },
          false,
          'resetTravelData'
        ),

      // // 테스트용 샘플 데이터 로드
      // loadSampleData: () =>
      //   set(
      //     {
      //       currentTour: sampleData.tour,
      //       schedules: sampleData.schedules,
      //       mapEntities: sampleData.mapEntities,
      //       trafficData: sampleData.trafficData.map((traffic) => ({
      //         ...traffic,
      //         scheduleId: traffic.scheduleId || '',
      //       })),
      //     },
      //     false,
      //     'loadSampleData'
      //   ),

      // 백엔드 연동 액션들
      saveTourToBackend: async () => {
        const { currentTour, schedules, mapEntities, trafficData, weatherData } = get();
        
        if (!currentTour) {
          console.error('저장할 여행 데이터가 없습니다.');
          return null;
        }

        try {
          set({ isLoading: true, error: null }, false, 'saveTourToBackend:start');
          
          console.log('=== 저장 시작 ===');
          console.log('현재 투어:', currentTour);
          console.log('일정 목록:', schedules);
          console.log('지도 엔티티:', mapEntities);
          console.log('교통편 데이터:', trafficData);
          console.log('날씨 데이터:', weatherData);
          
          // 사용자 인증 상태 확인 및 userId 가져오기
          const storedUser = localStorage.getItem('user');
          let currentUserId = currentTour.userId;
          
          if (!currentUserId && storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              currentUserId = userData.userId;
              console.log('localStorage에서 userId 가져옴:', currentUserId);
            } catch (error) {
              console.error('localStorage 사용자 데이터 파싱 실패:', error);
            }
          }
          
          if (!currentUserId) {
            console.error('사용자 ID가 없습니다. 로그인이 필요합니다.');
            set({
              isLoading: false,
              error: '로그인이 필요합니다. 사용자 인증 후 다시 시도해주세요.'
            }, false, 'saveTourToBackend:nouser');
            return null;
          }
          
          // currentTour에 userId 설정
          currentTour.userId = currentUserId;
          
          // 프론트엔드 데이터를 백엔드 형식으로 변환
          const backendTour = convertTourToBackendFormat(
            currentTour,
            schedules,
            mapEntities,
            trafficData,
            weatherData
          );
          
          console.log('백엔드 전송 데이터:', JSON.stringify(backendTour, null, 2));

          let savedTour: TourType;
          
          if (currentTour.tourId) {
            // 기존 여행 수정
            savedTour = await tourAPI.updateTour(currentTour.tourId, backendTour);
            console.log('여행 계획 수정 완료:', savedTour);
          } else {
            // 새 여행 생성
            savedTour = await tourAPI.createTour(backendTour);
            console.log('새 여행 계획 생성 완료:', savedTour);
          }

          // 저장된 데이터로 업데이트
          set(
            {
              currentTour: {
                ...currentTour,
                tourId: savedTour.tourId,
                createDate: savedTour.createDate,
                modifiedDate: savedTour.modifiedDate
              },
              isLoading: false
            },
            false,
            'saveTourToBackend:success'
          );

          return savedTour;
        } catch (error) {
          console.error('여행 계획 저장 실패:', error);
          
          // Axios 에러 상세 정보 추출
          // if (error && typeof error === 'object' && 'response' in error) {
          //   const axiosError = error as any;
          //   console.error('백엔드 응답:', axiosError.response?.data);
          //   console.error('상태 코드:', axiosError.response?.status);
          //   console.error('요청 데이터:', axiosError.config?.data);
          // }
          
          set(
            {
              isLoading: false,
              error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
            },
            false,
            'saveTourToBackend:error'
          );
          return null;
        }
      },

      loadTourFromBackend: async (tourId: number) => {
        try {
          set({ isLoading: true, error: null }, false, 'loadTourFromBackend:start');
          
          const backendTour = await tourAPI.getTourById(tourId);
          const converted = convertTourFromBackendFormat(backendTour);
          
          set(
            {
              currentTour: converted.tour,
              schedules: converted.schedules,
              mapEntities: converted.mapEntities,
              trafficData: converted.trafficData,
              weatherData: converted.weatherData,
              isLoading: false
            },
            false,
            'loadTourFromBackend:success'
          );
          
          console.log('여행 계획 로드 완료:', converted);
        } catch (error) {
          console.error('여행 계획 로드 실패:', error);
          set(
            {
              isLoading: false,
              error: error instanceof Error ? error.message : '로드 중 오류가 발생했습니다.'
            },
            false,
            'loadTourFromBackend:error'
          );
        }
      },

      loadUserToursFromBackend: async (userId: number) => {
        try {
          set({ isLoading: true, error: null }, false, 'loadUserToursFromBackend:start');
          
          const tours = await tourAPI.getToursByUserId(userId);
          
          set({ isLoading: false }, false, 'loadUserToursFromBackend:success');
          
          console.log('사용자 여행 목록 로드 완료:', tours);
          return tours;
        } catch (error) {
          console.error('사용자 여행 목록 로드 실패:', error);
          set(
            {
              isLoading: false,
              error: error instanceof Error ? error.message : '목록 로드 중 오류가 발생했습니다.'
            },
            false,
            'loadUserToursFromBackend:error'
          );
          return [];
        }
      },

      createNewTourInBackend: async (userId: number) => {
        try {
          set({ isLoading: true, error: null }, false, 'createNewTourInBackend:start');
          
          const today = new Date().toISOString().split('T')[0];
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const newTourData: Omit<TourType, 'tourId' | 'createDate' | 'modifiedDate'> = {
            userId,
            title: '나의 여행 계획',
            startDate: today,
            endDate: nextWeek,
            travelers: 2,
            budget: 'medium',
            planData: {
              schedules: [],
              weatherData: [],
              metadata: {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                totalDays: 0,
                estimatedBudget: 0
              }
            }
          };
          
          const createdTour = await tourAPI.createTour(newTourData);
          
          // 생성된 여행을 현재 여행으로 설정
          set(
            {
              currentTour: createdTour,
              schedules: [],
              mapEntities: [],
              trafficData: [],
              weatherData: [],
              isLoading: false
            },
            false,
            'createNewTourInBackend:success'
          );
          
          console.log('새 여행 생성 완료:', createdTour);
          return createdTour;
        } catch (error) {
          console.error('새 여행 생성 실패:', error);
          set(
            {
              isLoading: false,
              error: error instanceof Error ? error.message : '생성 중 오류가 발생했습니다.'
            },
            false,
            'createNewTourInBackend:error'
          );
          return null;
        }
      },
    }),
    {
      name: 'travel-store', // devtools에서 보여질 이름
    }
  )
);

// 편의 함수들
export const useTravelActions = () => {
  const store = useTravelStore();
  return {
    setCurrentTour: store.setCurrentTour,
    updateTourInfo: store.updateTourInfo,
    clearCurrentTour: store.clearCurrentTour,
    resetTourInfo: store.resetTourInfo,
    // 날짜 관리 액션들
    generateAvailableDates: store.generateAvailableDates,
    setSelectedDate: store.setSelectedDate,
    addNextDate: store.addNextDate,
    addSchedule: store.addSchedule,
    updateSchedule: store.updateSchedule,
    removeSchedule: store.removeSchedule,
    reorderSchedules: store.reorderSchedules,
    addLocationToSchedule: store.addLocationToSchedule,
    removeMapEntity: store.removeMapEntity,
    updateMapEntity: store.updateMapEntity,
    addRouteToSchedule: store.addRouteToSchedule,
    removeTraffic: store.removeTraffic,
    setSelectedLocation: store.setSelectedLocation,
    setRouteResults: store.setRouteResults,
    toggleRoutePanel: store.toggleRoutePanel,
    setRoutePanelOpen: store.setRoutePanelOpen,
    // 지도 포커스 제어
    focusMapOnLocation: store.focusMapOnLocation,
    clearMapFocus: store.clearMapFocus,
    setWeatherData: store.setWeatherData,
    setSelectedDayIndex: store.setSelectedDayIndex,
    setLoading: store.setLoading,
    setError: store.setError,
    resetTravelData: store.resetTravelData,
    loadSampleData: store.loadSampleData,
    // 백엔드 연동 액션들
    saveTourToBackend: store.saveTourToBackend,
    loadTourFromBackend: store.loadTourFromBackend,
    loadUserToursFromBackend: store.loadUserToursFromBackend,
    createNewTourInBackend: store.createNewTourInBackend,
  };
};

// 상태만 가져오는 함수
export const useTravelState = () => {
  const store = useTravelStore();
  return {
    currentTour: store.currentTour,
    schedules: store.schedules,
    mapEntities: store.mapEntities,
    trafficData: store.trafficData,
    // 날짜 관리 상태
    availableDates: store.availableDates,
    selectedDate: store.selectedDate,
    selectedLocation: store.selectedLocation,
    routeResults: store.routeResults,
    isRoutePanelOpen: store.isRoutePanelOpen,
    // 지도 포커스 상태
    mapFocusLocation: store.mapFocusLocation,
    weatherData: store.weatherData,
    selectedDayIndex: store.selectedDayIndex,
    isLoading: store.isLoading,
    error: store.error,
  };
};