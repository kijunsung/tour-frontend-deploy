# 여행 계획 작성 시스템 개발 계획서

## 📋 프로젝트 개요

여행 계획 작성을 위한 통합 플랫폼 개발
- **주요 기능**: 지도 기반 여행지 검색, 교통편 조회, 날씨 정보, 일정 관리
- **기술 스택**: React + TypeScript, Material-UI, Google Maps API, OpenWeather API
- **상태 관리**: Recoil/Zustand
- **HTTP 클라이언트**: Axios

## 🗂 DB 구조 분석

### Tour (여행)
- `tourId`: 여행 ID (Primary Key)
- `userId`: 사용자 ID (Foreign Key)
- `title`: 여행 제목
- `startDate`: 여행 시작일
- `endDate`: 여행 종료일
- `createDate`, `modifiedDate`: 생성/수정 일시

### Schedule (일정)
- `scheduleId`: 일정 ID (Primary Key)
- `tourId`: 여행 ID (Foreign Key)
- `scheduleTitle`: 일정 제목
- `content`: 일정 내용
- `date`: 일정 날짜
- `startTime`, `endTime`: 시작/종료 시간
- `createDate`, `modifiedDate`: 생성/수정 일시

### MapEntity (여행지)
- `mapId`: 지도 엔티티 ID (Primary Key)
- `scheduleId`: 일정 ID (Foreign Key)
- `tourId`: 여행 ID (Foreign Key)
- `location`: 위치 정보 (여행지 이름 + 구글맵 링크)
- `createDate`: 생성 일시

### Traffic (교통편)
- `trafficId`: 교통편 ID (Primary Key)
- `tourId`: 여행 ID (Foreign Key)
- `vehicle`: 교통수단 정보 (상세 경로 정보 포함)
- `spendTime`: 소요 시간
- `price`: 요금

### Weather (날씨) - DB 저장 예정이지만 현재 단계에서는 실시간 조회만
- `weatherId`: 날씨 ID (Primary Key)
- `tourId`: 여행 ID (Foreign Key)
- `temperature`: 온도
- `description`: 날씨 설명
- `createDate`, `modifiedDate`: 생성/수정 일시

## 🎯 개발 단계별 계획

### Phase 1: 기본 구조 및 타입 정의

#### 1.1 TypeScript 타입 정의 (types/)
```typescript
// types/travel.ts
export interface TourType {
  tourId?: number;
  userId?: number;
  title: string;
  startDate: string;
  endDate: string;
  travelers: number;        // 여행자 수
  budget: 'low' | 'medium' | 'high' | 'luxury';  // 예산 범위
  createDate?: string;
  modifiedDate?: string;
}

export interface ScheduleType {
  scheduleId?: number;
  tourId: number;
  scheduleTitle: string;
  content: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface MapEntityType {
  mapId?: number;
  scheduleId: number;
  tourId: number;
  location: string; // 여행지 이름
  googleMapLink: string; // 구글맵 링크
  photoUrl?: string; // 구글 Places API에서 가져온 사진
  rating?: number; // 구글 별점
}

export interface TrafficType {
  trafficId?: number;
  tourId: number;
  vehicle: string; // 교통수단 상세 정보 (JSON 형태)
  spendTime: string; // ISO datetime format
  price: number;
  departureTime: string;
  arrivalTime: string;
  route: string; // 경로 설명
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
  mode: 'BUS' | 'SUBWAY';
  line: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
}
```

#### 1.2 상태 관리 설정 (store/)
```typescript
// store/travelStore.ts (Zustand 사용)
interface TravelState {
  currentTour: TourType | null;
  schedules: ScheduleType[];
  mapEntities: MapEntityType[];
  trafficData: TrafficType[];
  selectedLocation: google.maps.places.PlaceResult | null;
  routeResults: RouteResult[];
  weatherData: WeatherType[];
  isRoutePanelOpen: boolean;
}
```

**주요 확인 사항**:
- TypeScript 타입이 백엔드 Entity와 정확히 매칭되는지 확인
- Google Maps API 타입과 우리 커스텀 타입 간의 변환 로직 검증
- 상태 관리 라이브러리 Zustand 결정

### Phase 1.5: 여행 기본 정보 폼 구현

#### 1.5.1 여행 정보 컴포넌트 구현
```typescript
// components/TravelInfo/TravelInfo.tsx
export const TravelInfo: React.FC = () => {
  const [travelData, setTravelData] = useState<TourType>({
    title: '',
    startDate: '',
    endDate: '',
    travelers: 2,
    budget: 'medium'
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        🎯 여행 정보
      </Typography>
      
      <TextField
        fullWidth
        label="여행 제목"
        placeholder="예: 김철수의 서울 여행"
        value={travelData.title}
        onChange={(e) => setTravelData(prev => ({...prev, title: e.target.value}))}
        margin="normal"
      />
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <TextField
          type="date"
          label="시작일"
          value={travelData.startDate}
          onChange={(e) => setTravelData(prev => ({...prev, startDate: e.target.value}))}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
        <TextField
          type="date"
          label="종료일"
          value={travelData.endDate}
          onChange={(e) => setTravelData(prev => ({...prev, endDate: e.target.value}))}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
      </Box>
      
      <FormControl fullWidth margin="normal">
        <InputLabel>여행자 수</InputLabel>
        <Select
          value={travelData.travelers}
          onChange={(e) => setTravelData(prev => ({...prev, travelers: Number(e.target.value)}))}
        >
          <MenuItem value={1}>1명 (혼자)</MenuItem>
          <MenuItem value={2}>2명 (커플/친구)</MenuItem>
          <MenuItem value={3}>3명</MenuItem>
          <MenuItem value={4}>4명 (가족)</MenuItem>
          <MenuItem value={5}>5명 이상</MenuItem>
        </Select>
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <InputLabel>예상 예산</InputLabel>
        <Select
          value={travelData.budget}
          onChange={(e) => setTravelData(prev => ({...prev, budget: e.target.value as any}))}
        >
          <MenuItem value="low">50만원 이하</MenuItem>
          <MenuItem value="medium">50-100만원</MenuItem>
          <MenuItem value="high">100-200만원</MenuItem>
          <MenuItem value="luxury">200만원 이상</MenuItem>
        </Select>
      </FormControl>
    </Paper>
  );
};
```

#### 1.5.2 상태 관리 확장
```typescript
// store/travelStore.ts에 추가
interface TravelState {
  currentTour: TourType | null;
  // 기존 상태들...
  
  // 액션 추가
  updateTourInfo: (tourInfo: Partial<TourType>) => void;
  resetTourInfo: () => void;
}
```

#### 1.5.3 Tours.tsx 레이아웃 수정
```typescript
// pages/Tours/Tours.tsx
export const Tours: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 지도 영역 (60%) */}
      <Box sx={{ flex: '0 0 60%' }}>
        <Maps />
      </Box>
      
      {/* 사이드 패널 영역 (40%) */}
      <Box sx={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column' }}>
        {/* 여행 정보 (25%) */}
        <Box sx={{ flex: '0 0 25%', overflow: 'auto' }}>
          <TravelInfo />
        </Box>
        
        {/* 날씨 정보 (15%) */}
        <Box sx={{ flex: '0 0 15%' }}>
          <Weathers location={selectedLocation} />
        </Box>
        
        {/* 일정 관리 (60%) */}
        <Box sx={{ flex: '1', overflow: 'auto' }}>
          <Schedules />
        </Box>
      </Box>
    </Box>
  )
}
```

**주요 확인 사항**:
- Material-UI 컴포넌트 스타일링 일관성 확보
- 반응형 디자인 (모바일에서는 접힐 수 있도록)
- 입력 데이터 실시간 검증 (날짜 유효성, 제목 길이 등)
- 상태 관리와의 연동 확인

### Phase 2: Google Maps 통합 및 지도 기능 구현

#### 2.1 Maps.tsx 기본 구조
```typescript
// pages/Maps/Maps.tsx
export const Maps: React.FC = () => {
  // Google Maps 로딩
  // 검색창 구현
  // 지도 표시
  // 검색 결과 표시 (왼쪽 패널)
  // 길찾기 패널 (오른쪽, 토글 방식)
}
```

#### 2.2 핵심 기능 구현
1. **Google Maps 초기화**
   - `@react-google-maps/api` 사용
   - 기본 위치: 서울 중심
   - 줌 레벨: 13

2. **검색창 구현**
   - Google Places Autocomplete API 연동
   - 검색 결과: 관광지, 레스토랑, 명소 등
   - 검색창 위치: 지도 상단 중앙

3. **검색 결과 표시 (왼쪽 패널)**
   - 여행지 이름, 사진, 별점, 주소
   - 구글맵 링크 (새 창)
   - "일정 추가" 버튼

4. **길찾기 기능 (오른쪽 패널)**
   - 출발지/목적지 입력
   - 출발 시간 선택 (DateTimePicker)
   - Google Maps Routes API 연동
   - 대중교통만 (TRANSIT 모드)
   - 결과 최대 5개 표시
   - "일정 추가" 버튼

**주요 확인 사항**:
- Google Maps API 키 설정 및 권한 확인
- Places API, Routes API 할당량 확인
- 지도 크기 및 반응형 디자인 검증
- 검색 결과 패널과 길찾기 패널의 UI/UX 충돌 방지

### Phase 3: 교통편 조회 및 결과 표시

#### 3.1 Google Maps Routes API 연동
```typescript
// services/routeService.ts
export const getPublicTransitRoutes = async (
  origin: string,
  destination: string,
  departureTime: Date
): Promise<RouteResult[]> => {
  // Google Maps Routes API 호출
  // 대중교통 결과 파싱
  // 최대 5개 결과 반환
}
```

#### 3.2 교통편 결과 컴포넌트
```typescript
// components/RouteResults.tsx
export const RouteResults: React.FC<{
  routes: RouteResult[];
  onAddToSchedule: (route: RouteResult) => void;
}> = ({ routes, onAddToSchedule }) => {
  // 각 경로별 상세 정보 표시
  // 소요시간, 환승횟수, 요금
  // "일정 추가" 버튼
}
```

**주요 확인 사항**:
- Routes API 응답 데이터 구조 분석 및 파싱 로직 검증
- 대중교통 정보의 정확성 (실시간 정보 vs 정적 정보)
- 요금 정보 가용성 확인 (Google API에서 제공 여부)
- 교통편 검색 시 로딩 상태 및 에러 처리

### Phase 4: 날씨 정보 연동

#### 4.1 OpenWeather API 연동
```typescript
// services/weatherService.ts
export const getWeatherForecast = async (
  lat: number,
  lng: number
): Promise<WeatherType[]> => {
  // OpenWeather API 5일 예보 조회
  // 데이터 변환 및 반환
}
```

#### 4.2 날씨 컴포넌트
```typescript
// pages/Weathers/Weathers.tsx
export const Weathers: React.FC<{
  location: { lat: number; lng: number } | null;
}> = ({ location }) => {
  // 5일간 날씨 예보 표시
  // 간단한 UI (작은 크기)
  // 온도, 날씨 아이콘, 간단한 설명
}
```

**주요 확인 사항**:
- OpenWeather API 키 설정 및 할당량 확인
- 위치 좌표 정확성 (Google Places API에서 가져온 좌표)
- 날씨 아이콘 표시 방식 결정
- 섭씨 온도 표시

### Phase 5: 일정 관리 시스템

#### 5.1 일정 상태 관리
```typescript
// store/scheduleStore.ts
interface ScheduleState {
  currentSchedules: ScheduleType[];
  addLocationToSchedule: (location: MapEntityType) => void;
  addRouteToSchedule: (route: RouteResult) => void;
  updateScheduleTime: (scheduleId: number, startTime: string, endTime: string) => void;
  removeFromSchedule: (scheduleId: number) => void;
}
```

#### 5.2 일정 표시 컴포넌트
```typescript
// pages/Schedules/Schedules.tsx
export const Schedules: React.FC = () => {
  // 일정 목록 표시
  // 드래그&드롭으로 순서 변경
  // 시간 클릭으로 수정 가능
  // 저장 버튼
}
```

**주요 확인 사항**:
- 일정 추가 시 기본 시간 설정 로직 (예: 2시간 간격)
- 여행지와 교통편이 혼재된 일정의 시간 순서 정렬
- 일정 수정 시 실시간 업데이트
- 저장 전 임시 저장 (로컬 스토리지 활용)

### Phase 6: 데이터 영속성 및 API 연동

#### 6.1 API 서비스 구현
```typescript
// services/api.ts
export const tourAPI = {
  createTour: (tour: TourType) => Promise<TourType>,
  savePlan: (tourId: number, schedules: ScheduleType[], maps: MapEntityType[], traffic: TrafficType[]) => Promise<void>,
  getTour: (tourId: number) => Promise<TourType>,
  updateTour: (tour: TourType) => Promise<TourType>
}
```

#### 6.2 저장 로직 구현
- 여행 기본 정보 저장 (Tour)
- 일정별 세부 정보 저장 (Schedule)
- 여행지 정보 저장 (MapEntity)
- 교통편 정보 저장 (Traffic)
- 트랜잭션 처리로 데이터 무결성 보장

**주요 확인 사항**:
- 백엔드 API 엔드포인트 확인
- 데이터 검증 로직 (필수 필드, 형식 검증)
- 저장 실패 시 롤백 처리
- 네트워크 오류 시 재시도 로직

### Phase 7: 통합 및 Tours.tsx 구현

#### 7.1 메인 컴포넌트 구조
```typescript
// pages/Tours/Tours.tsx
export const Tours: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* 지도 영역 (60%) */}
      <Box sx={{ flex: '0 0 60%' }}>
        <Maps />
      </Box>
      
      {/* 사이드 패널 영역 (40%) */}
      <Box sx={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column' }}>
        {/* 날씨 정보 (20%) */}
        <Box sx={{ flex: '0 0 20%' }}>
          <Weathers location={selectedLocation} />
        </Box>
        
        {/* 일정 관리 (80%) */}
        <Box sx={{ flex: '1' }}>
          <Schedules />
        </Box>
      </Box>
    </Box>
  )
}
```

**주요 확인 사항**:
- 컴포넌트 간 데이터 흐름 및 상태 공유
- 반응형 디자인 (모바일/태블릿 대응)
- 성능 최적화 (불필요한 리렌더링 방지)
- 사용자 경험 (로딩 상태, 에러 메시지)

## ❓ 질문 및 확인 사항 (답변 완료)

### 1. 데이터 저장 형식 관련 ✅
- **MapEntity의 location 필드**: JSON 형태로 저장 확정
  ```json
  {
    "name": "여행지명",
    "link": "구글맵URL",
    "placeId": "구글PlaceID",
    "address": "주소",
    "photoUrl": "사진URL",
    "rating": 4.5
  }
  ```
  
- **Traffic의 vehicle 필드**: JSON 형태로 경로 전체 정보 저장 확정
  ```json
  {
    "mode": "TRANSIT",
    "steps": [
      {
        "mode": "BUS",
        "line": "버스번호",
        "departure": "출발지",
        "arrival": "도착지",
        "departureTime": "출발시간",
        "arrivalTime": "도착시간"
      }
    ],
    "totalDuration": "총소요시간",
    "transfers": "환승횟수"
  }
  ```

### 2. 기본값 설정 ✅
- **일정 추가 시 기본 시간**: 
  - 여행지: 2시간 기본 설정
  - 교통편: Google Routes API에서 제공하는 실제 소요시간 사용
  
- **교통편 요금**: Google API에서 제공하지 않을 경우 "요금 정보 없음" 표시

### 3. 기술적 고려사항 ✅
- **Weather 정보**: 
  - 현재 단계에서는 실시간 조회만 구현
  - DB 저장 기능은 추후 순서 관리를 위해 준비 (여행지, 교통, 날씨 등의 저장 순서 복원)
  - 현재는 OpenWeather API로 실시간 조회만 사용
  
- **API 할당량**: Google Maps API와 OpenWeather API 무료 버전 제한 내에서 사용
  - Google Maps API: 월 $200 크레딧 (무료)
  - OpenWeather API: 1,000 calls/day (무료)

### 4. UI/UX 관련 ✅
- **화면 레이아웃**: 60%(지도) + 40%(사이드패널) 비율로 진행
- **모바일 대응**: 반응형 디자인 필수 구현
  - 모바일에서는 탭 방식으로 지도/일정 전환
  - 태블릿에서는 상하 분할 레이아웃

### 5. 추가 기술적 고려사항
- **API 키 관리**: 환경변수로 안전하게 관리
- **에러 처리**: API 호출 실패, 네트워크 오류 등
- **성능 최적화**: 지도 렌더링, 대용량 검색 결과 처리
- **접근성**: 키보드 내비게이션, 스크린 리더 지원

### 6. 개발 우선순위
1. **1순위**: 여행 정보 폼 (TravelInfo.tsx)
2. **2순위**: Maps.tsx (검색 기능)
3. **3순위**: Schedules.tsx (일정 관리)
4. **4순위**: 교통편 조회 기능
5. **5순위**: Weathers.tsx
6. **6순위**: 데이터 저장 기능
7. **7순위**: Tours.tsx 통합

## 🔄 개발 프로세스

### 단계별 검증 체크리스트

#### Phase 1 완료 시
- [ ] TypeScript 타입 정의 완료
- [ ] 상태 관리 스토어 설정 완료
- [ ] Google Maps API 키 설정 및 테스트
- [ ] OpenWeather API 키 설정 및 테스트

#### Phase 1.5 완료 시
- [ ] 여행 정보 폼 컴포넌트 구현 완료
- [ ] 여행자 수 및 예산 선택 기능 동작
- [ ] 날짜 입력 유효성 검증 (시작일 ≤ 종료일)
- [ ] 상태 관리와의 연동 확인
- [ ] 반응형 레이아웃 적용

#### Phase 2 완료 시
- [ ] 지도 정상 렌더링
- [ ] 검색창 자동완성 기능 동작
- [ ] 검색 결과 목록 표시
- [ ] 마커 표시 및 클릭 이벤트

#### Phase 3 완료 시
- [ ] 길찾기 패널 토글 기능
- [ ] 대중교통 경로 검색 결과 표시
- [ ] 경로 상세 정보 표시
- [ ] 일정 추가 기능 연동

#### Phase 4 완료 시
- [ ] 선택된 위치의 날씨 정보 표시
- [ ] 5일 예보 정확성 확인
- [ ] 날씨 아이콘 및 UI 완성

#### Phase 5 완료 시
- [ ] 일정 목록 표시 및 관리
- [ ] 시간 수정 기능
- [ ] 드래그&드롭 순서 변경
- [ ] 저장 버튼 기능

#### Phase 6 완료 시
- [ ] 백엔드 API 연동 완료
- [ ] 데이터 저장/조회 기능 테스트
- [ ] 에러 처리 및 예외 상황 대응

#### Phase 7 완료 시
- [ ] 전체 기능 통합 테스트
- [ ] 사용자 시나리오 테스트
- [ ] 성능 및 접근성 검증
- [ ] 크로스 브라우저 테스트

## 📚 참고 자료

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Google Routes API](https://developers.google.com/maps/documentation/routes)
- [OpenWeather API](https://openweathermap.org/api)
- [Material-UI 문서](https://mui.com/)
- [React Router 문서](https://reactrouter.com/)

---

## 🎯 Phase 8: Schedules-Maps 인터랙션 기능 (고도화)

### 개요
Schedules 컴포넌트와 Maps 컴포넌트 간의 양방향 인터랙션을 구현하여 직관적이고 인터랙티브한 여행 계획 도구 완성

### 8.1 여행지 일정 클릭 기능

#### 핵심 기능
- **지도 자동 이동**: 여행지 일정 클릭 시 해당 위치로 지도 중심 이동
- **마커 하이라이트**: 선택된 여행지 마커를 특별한 스타일로 강조 표시
- **정보 표시**: 검색 결과 패널 또는 InfoWindow에 해당 장소 정보 자동 표시

#### 구현 방식
```typescript
// travelStore.ts 상태 확장
interface TravelState {
  highlightedLocation: LocationData | null;  // 강조할 여행지
  mapViewMode: 'normal' | 'highlight' | 'route'; // 지도 표시 모드
}

// Schedules.tsx에서 클릭 이벤트
const handleLocationClick = (schedule: ScheduleType) => {
  const locationData = parseLocationData(mapEntity.location);
  setHighlightedLocation(locationData);
  setMapCenter(locationData.coordinates);
};
```

#### 사용자 경험
1. Schedules에서 "경복궁 관람" 일정 클릭
2. Maps 지도가 경복궁 위치로 부드럽게 이동
3. 경복궁 마커가 빨간색으로 변경되며 크기 확대
4. 검색 결과 패널에 경복궁 상세 정보 표시

### 8.2 교통편 일정 클릭 기능

#### 핵심 기능
- **경로 시각화**: Google Maps Polyline API를 사용한 실제 경로 표시
- **출발지/도착지 마커**: 시작점과 끝점을 구분되는 마커로 표시
- **경로 정보 표시**: 길찾기 패널에 해당 경로의 상세 정보 표시

#### 구현 방식
```typescript
// 경로 표시 상태 추가
interface TravelState {
  displayedRoute: RouteResult | null;      // 표시할 경로
  routePolyline: google.maps.Polyline | null; // 지도상 경로 선
}

// GoogleMapContainer.tsx 확장
- Polyline 컴포넌트 추가
- 경로별 색상 구분 (지하철: 파란색, 버스: 초록색)
- 경로 애니메이션 효과
```

#### 사용자 경험
1. Schedules에서 "홍대입구역 → 강남역" 교통편 클릭
2. 지도에 지하철 경로가 파란색 선으로 표시
3. 출발지(초록 마커), 도착지(빨간 마커) 표시
4. 길찾기 패널에 환승 정보 및 소요시간 표시

### 8.3 양방향 인터랙션

#### Maps → Schedules 연동
- **마커 클릭**: 지도 마커 클릭 시 해당 일정이 Schedules에서 강조 표시
- **검색 후 추가**: Maps에서 새로 검색한 장소를 일정에 추가 시 즉시 Schedules 업데이트

#### 상태 동기화
```typescript
// 양방향 통신을 위한 액션 추가
setHighlightedSchedule: (scheduleId: number) => void;
clearHighlights: () => void;
syncMapWithSchedule: (schedule: ScheduleType) => void;
```

### 8.4 시각적 강화 요소

#### 마커 스타일 시스템
```typescript
const MARKER_STYLES = {
  default: { color: '#4285f4', size: 32 },
  highlighted: { color: '#ea4335', size: 40, animation: 'bounce' },
  routeStart: { color: '#34a853', size: 36, icon: 'start' },
  routeEnd: { color: '#ea4335', size: 36, icon: 'end' }
};
```

#### 경로 스타일 시스템
```typescript
const ROUTE_STYLES = {
  subway: { color: '#4285f4', weight: 6, opacity: 0.8 },
  bus: { color: '#34a853', weight: 5, opacity: 0.7 },
  walking: { color: '#9aa0a6', weight: 3, opacity: 0.6, pattern: 'dashed' }
};
```

### 8.5 구현 우선순위

#### Phase 8.1 - 기본 인터랙션 (2-3시간)
- [ ] 여행지 일정 클릭 → 지도 이동 기능
- [ ] 마커 하이라이트 시스템 구현
- [ ] 기본 상태 관리 확장

#### Phase 8.2 - 경로 시각화 (3-4시간)
- [ ] Google Maps Polyline API 연동
- [ ] 교통편 클릭 → 경로 표시 기능
- [ ] 경로 스타일 시스템 구현

#### Phase 8.3 - 양방향 연동 (2-3시간)
- [ ] Maps → Schedules 역방향 통신
- [ ] 상태 동기화 완성
- [ ] 하이라이트 해제 기능

#### Phase 8.4 - UI/UX 최적화 (1-2시간)
- [ ] 애니메이션 효과 추가
- [ ] 색상 및 스타일 최적화
- [ ] 반응형 디자인 적용

### 8.6 기술적 고려사항

#### 성능 최적화
- **메모이제이션**: React.memo, useMemo를 사용한 불필요한 리렌더링 방지
- **상태 관리**: 하이라이트 상태의 효율적 관리
- **API 호출 최소화**: 이미 로드된 경로 정보 재사용

#### 사용자 경험
- **부드러운 전환**: 지도 이동 시 panTo() 사용으로 자연스러운 애니메이션
- **시각적 피드백**: 클릭/호버 상태의 명확한 표시
- **오류 처리**: 잘못된 좌표나 경로 정보에 대한 예외 처리

#### 접근성
- **키보드 내비게이션**: 마우스 없이도 일정 선택 가능
- **스크린 리더**: 지도 상태 변화에 대한 음성 안내
- **색상 대비**: 색맹 사용자를 위한 적절한 색상 선택

### 8.7 예상 효과

#### 사용자 경험 향상
- **직관성**: 일정과 지도의 직접적 연결로 이해도 증가
- **편의성**: 클릭 한 번으로 관련 정보 즉시 확인
- **몰입감**: 인터랙티브한 경험으로 사용자 참여도 증가

#### 기능적 완성도
- **통합성**: Schedules와 Maps의 완전한 연동
- **시각화**: 추상적인 일정을 구체적인 지도로 표현
- **차별화**: 일반적인 일정 관리 도구를 넘어선 여행 계획 플랫폼

### 8.8 확장 가능성

#### 고급 기능 아이디어
- **일정 순서 최적화**: 지리적 위치를 고려한 최적 경로 제안
- **실시간 정보**: 교통 상황, 영업시간 등 실시간 데이터 연동
- **AR 연동**: 모바일에서 증강현실을 통한 현장 안내
- **소셜 기능**: 다른 사용자와 여행 계획 공유 및 추천

---

**최종 업데이트**: 2025-07-08
**개발 예상 기간**: 4-6주 + Phase 8 (1-2주)
**개발자**: Full-Stack Developer
