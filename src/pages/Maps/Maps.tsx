import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  Typography,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Rating,
  Button,
  IconButton,
  Chip,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
} from "@mui/material";
import {
  Directions as DirectionsIcon,
  Close as CloseIcon,
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
  DirectionsBus as DirectionsBusIcon,
  Clear as ClearIcon,
  VisibilityOff as VisibilityOffIcon,
  List as ListIcon,
  OpenInNew as OpenInNewIcon,
  SwapVert as SwapVertIcon,
  MyLocation as MyLocationIcon,
} from "@mui/icons-material";

// 컴포넌트 imports
import GoogleMapsLoader from "./MapsComponent/GoogleMapsLoader";
import GoogleMapContainer from "./MapsComponent/GoogleMapContainer";
import MapSearchBox from "./MapsComponent/MapSearchBox";
import PlaceSearchInput from "./MapsComponent/PlaceSearchInput";
import { searchTransitRoutes } from "./MapsComponent/RouteSearchService";

// 어제 작업한 타입들 import
import { LocationData, RouteResult } from "../../types/travel";
import { useTravelStore } from "../../store/travelStore";
import { GooglePlaceResult } from "../../types/googleMaps";

// Google Places API 응답을 위한 타입 (Maps.tsx 내부 사용)
interface SearchResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  photoUrl?: string;
  placeId: string;
  location: {
    lat: number;
    lng: number;
  };
}

const Maps: React.FC = () => {
  // ========================
  // 상태 관리
  // ========================
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  // const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError] = useState<string>("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] =
    useState<boolean>(false);

  // 길찾기 패널 관련 상태
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState<boolean>(false);
  const [departureLocation, setDepartureLocation] =
    useState<LocationData | null>(null);
  const [destinationLocation, setDestinationLocation] =
    useState<LocationData | null>(null);
  const [routeResults, setRouteResults] = useState<RouteResult[]>([]);
  const [isSearchingRoute, setIsSearchingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string>("");

  // 시간 설정 관련 상태
  const [timeOption, setTimeOption] = useState<"now" | "depart" | "arrive">(
    "now"
  );
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");

  // 선택된 위치 및 마커 상태
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [mapMarkers, setMapMarkers] = useState<LocationData[]>([]);
  // 지도 중심 좌표 상태 추가
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Zustand store
  const {
    addLocationToSchedule,
    addRouteToSchedule,
    setSelectedLocation: setStoreSelectedLocation,
    mapFocusLocation,
    clearMapFocus,
  } = useTravelStore();

  // ========================
  // 유틸리티 함수들
  // ========================

  /**
   * 시간 문자열을 24시간 형식으로 변환
   * "오전 10:30" → "10:30", "오후 2:15" → "14:15"
   */
  const formatTimeTo24Hour = useCallback((timeString: string): string => {
    if (!timeString) return "";

    // 이미 24시간 형식인지 확인 (HH:MM 패턴)
    if (/^\d{1,2}:\d{2}$/.test(timeString.trim())) {
      return timeString.trim();
    }

    try {
      // "오전/오후" 형식 처리
      if (timeString.includes("오전") || timeString.includes("오후")) {
        const isAfternoon = timeString.includes("오후");
        const timeOnly = timeString.replace(/오전|오후/g, "").trim();
        const [hours, minutes] = timeOnly.split(":").map(Number);

        let hour24 = hours;
        if (isAfternoon && hours !== 12) {
          hour24 = hours + 12;
        } else if (!isAfternoon && hours === 12) {
          hour24 = 0;
        }

        return `${hour24.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      }

      // "AM/PM" 형식 처리
      if (timeString.includes("AM") || timeString.includes("PM")) {
        const isAfternoon = timeString.includes("PM");
        const timeOnly = timeString.replace(/AM|PM/gi, "").trim();
        const [hours, minutes] = timeOnly.split(":").map(Number);

        let hour24 = hours;
        if (isAfternoon && hours !== 12) {
          hour24 = hours + 12;
        } else if (!isAfternoon && hours === 12) {
          hour24 = 0;
        }

        return `${hour24.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      }

      // 기타 형식인 경우 그대로 반환
      return timeString;
    } catch (error) {
      console.error("시간 변환 오류:", error, "Input:", timeString);
      return timeString; // 오류 시 원본 반환
    }
  }, []);

  // ========================
  // 지도 관련 함수들
  // ========================

  // 일정에서 지도 포커스 요청 감지
  useEffect(() => {
    if (mapFocusLocation) {
      console.log("Maps: 지도 포커스 요청 감지:", mapFocusLocation);

      // 지도 중심을 해당 위치로 이동
      setMapCenter({
        lat: mapFocusLocation.coordinates.lat,
        lng: mapFocusLocation.coordinates.lng,
      });

      // 마커에 추가 (중복 체크)
      const isDuplicate = mapMarkers.some(
        (marker) => marker.placeId === mapFocusLocation.placeId
      );
      if (!isDuplicate) {
        setMapMarkers((prev) => [...prev, mapFocusLocation]);
      }

      // 선택된 위치로 설정
      setSelectedLocation(mapFocusLocation);

      // 포커스 상태 청소
      clearMapFocus();
    }
  }, [mapFocusLocation, clearMapFocus, mapMarkers]);

  /**
   * LocationData를 GooglePlaceResult로 변환
   * Weathers 컴포넌트와의 연동을 위해 필요
   */
  const convertLocationDataToGooglePlace = useCallback(
    (location: LocationData): google.maps.places.PlaceResult => {
      return {
        place_id: location.placeId,
        name: location.name,
        formatted_address: location.address,
        geometry: {
          location: {
            lat: () => location.coordinates.lat,
            lng: () => location.coordinates.lng,
          },
        },
        rating: location.rating,
        photos: location.photoUrl
          ? [
              {
                getUrl: () => location.photoUrl!,
              },
            ]
          : undefined,
      } as google.maps.places.PlaceResult;
    },
    []
  );

  /**
   * 장소 선택 처리 (검색창에서)
   */
  const handlePlaceSelect = useCallback(
    (location: LocationData) => {
      console.log("장소 선택됨:", location);

      setSelectedLocation(location);

      // **Zustand store도 업데이트 (날씨 연동을 위해)**
      const googlePlace = convertLocationDataToGooglePlace(location);
      console.log("Maps: Zustand store에 업데이트할 GooglePlace:", googlePlace);
      if (googlePlace.place_id) {
        const convertedPlace: GooglePlaceResult = {
          place_id: googlePlace.place_id,
          name: googlePlace.name ?? '',
          formatted_address: "",
          geometry: {
            location: {
              lat: 0,
              lng: 0
            }
          },
          types: []
        };
        setStoreSelectedLocation(convertedPlace);
      }

      // **지도 중심을 선택된 장소로 이동**
      setMapCenter({
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
      });

      // 검색 결과에 추가 (중복 체크)
      const isDuplicate = mapMarkers.some(
        (marker) => marker.placeId === location.placeId
      );
      if (!isDuplicate) {
        setMapMarkers((prev) => [...prev, location]);
      }

      // 검색 결과 패널용 데이터 생성
      const searchResultItem: SearchResult = {
        id: location.placeId,
        name: location.name,
        address: location.address,
        rating: location.rating,
        photoUrl: location.photoUrl,
        placeId: location.placeId,
        location: {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
        },
      };

      // 검색 결과 목록에 추가 (중복 체크)
      setSearchResults((prev) => {
        const exists = prev.some(
          (result) => result.placeId === location.placeId
        );
        if (exists) return prev;

        const newResults = [searchResultItem, ...prev];
        // 검색 결과가 추가되면 패널 자동 열기
        setIsSearchResultsOpen(true);
        return newResults;
      });
    },
    [mapMarkers, convertLocationDataToGooglePlace, setStoreSelectedLocation]
  );

  /**
   * 현재 위치 요청
   */
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("현재 위치:", { lat: latitude, lng: longitude });

        // TODO: 현재 위치를 기준으로 지도 중심 이동
        // 이 부분은 GoogleMapContainer에 ref를 추가해서 구현할 예정
      },
      (error) => {
        console.error("위치 요청 실패:", error);
        alert("현재 위치를 가져올 수 없습니다.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분 캐시
      }
    );
  }, []);

  /**
   * 지도에서 위치 선택 처리
   */
  const handleMapLocationSelect = useCallback((location: LocationData) => {
    setSelectedLocation(location);
  }, []);

  /**
   * 검색 결과에서 위치 선택
   */
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const locationData: LocationData = {
        name: result.name,
        link: `https://maps.google.com/maps?place_id=${result.placeId}`,
        placeId: result.placeId,
        address: result.address,
        coordinates: {
          lat: result.location.lat,
          lng: result.location.lng,
        },
        photoUrl: result.photoUrl,
        rating: result.rating,
      };

      setSelectedLocation(locationData);

      // **Zustand store도 업데이트 (날씨 연동을 위해)**
      const googlePlace = convertLocationDataToGooglePlace(locationData);
      if (googlePlace.place_id) {
        const convertedPlace: GooglePlaceResult = {
          place_id: googlePlace.place_id,
          name: googlePlace.name ?? '',
          formatted_address: "",
          geometry: {
            location: {
              lat: 0,
              lng: 0
            }
          },
          types: []
        };
        setStoreSelectedLocation(convertedPlace);
      }

      // **검색 결과 선택 시도 지도 중심 이동**
      setMapCenter({
        lat: result.location.lat,
        lng: result.location.lng,
      });
    },
    [convertLocationDataToGooglePlace, setStoreSelectedLocation]
  );

  /**
   * 일정에 위치 추가 (수정된 버전)
   */
  const handleAddLocationToSchedule = useCallback(
    (result: SearchResult) => {
      const locationData: LocationData = {
        name: result.name,
        link: `https://maps.google.com/maps?place_id=${result.placeId}`,
        placeId: result.placeId,
        address: result.address,
        coordinates: {
          lat: result.location.lat,
          lng: result.location.lng,
        },
        photoUrl: result.photoUrl,
        rating: result.rating,
      };

      addLocationToSchedule(locationData);
      console.log("일정에 추가된 LocationData:", locationData);
    },
    [addLocationToSchedule]
  );

  /**
   * 검색 결과에서 길찾기 버튼 클릭 시 처리
   */
  const handleRouteFromSearchResult = useCallback((result: SearchResult) => {
    const locationData: LocationData = {
      name: result.name,
      link: `https://maps.google.com/maps?place_id=${result.placeId}`,
      placeId: result.placeId,
      address: result.address,
      coordinates: {
        lat: result.location.lat,
        lng: result.location.lng,
      },
      photoUrl: result.photoUrl,
      rating: result.rating,
    };

    // 목적지로 설정
    setDestinationLocation(locationData);

    // 길찾기 패널 열기
    setIsRoutePanelOpen(true);

    console.log("길찾기 목적지 설정:", locationData.name);
  }, []);

  // ========================
  // 길찾기 관련 함수들
  // ========================

  /**
   * 길찾기 패널 토글
   */
  const toggleRoutePanel = useCallback(() => {
    setIsRoutePanelOpen((prev) => !prev);
  }, []);

  /**
   * 출발지와 도착지 교체
   */
  const swapDepartureAndDestination = useCallback(() => {
    const temp = departureLocation;
    setDepartureLocation(destinationLocation);
    setDestinationLocation(temp);

    console.log("출발지와 목적지 교체:", {
      기존출발지: departureLocation?.name,
      기존목적지: destinationLocation?.name,
    });
  }, [departureLocation, destinationLocation]);

  /**
   * 현재 위치를 출발지로 설정
   */
  const handleSetCurrentLocationAsDeparture = useCallback(() => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("현재 위치 감지:", { lat: latitude, lng: longitude });

        // 역지오코딩으로 주소 정보 획득
        if (window.google && window.google.maps) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                const currentLocationData: LocationData = {
                  name: "현재 위치",
                  link: "",
                  placeId: `current_location_${Date.now()}`,
                  address: results[0].formatted_address,
                  coordinates: { lat: latitude, lng: longitude },
                };

                setDepartureLocation(currentLocationData);
                console.log("현재 위치를 출발지로 설정:", currentLocationData);
              } else {
                console.error("역지오코딩 실패:", status);
                // 주소를 가져올 수 없어도 좌표는 설정
                const currentLocationData: LocationData = {
                  name: "현재 위치",
                  link: "",
                  placeId: `current_location_${Date.now()}`,
                  address: `위도: ${latitude.toFixed(
                    6
                  )}, 경도: ${longitude.toFixed(6)}`,
                  coordinates: { lat: latitude, lng: longitude },
                };

                setDepartureLocation(currentLocationData);
              }
            }
          );
        } else {
          // Google Maps API가 아직 로드되지 않은 경우
          const currentLocationData: LocationData = {
            name: "현재 위치",
            link: "",
            placeId: `current_location_${Date.now()}`,
            address: `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(
              6
            )}`,
            coordinates: { lat: latitude, lng: longitude },
          };

          setDepartureLocation(currentLocationData);
        }
      },
      (error) => {
        console.error("위치 요청 실패:", error);
        let message = "현재 위치를 가져올 수 없습니다.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "현재 위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            message = "위치 요청 시간이 초과되었습니다.";
            break;
        }

        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분 캐시
      }
    );
  }, []);

  /**
   * 길찾기 검색 (실제 API 연동)
   *
   * 구현 이유:
   * 1. placeId 기반으로 정확한 위치 지정
   * 2. Google Directions API로 실제 대중교통 정보 획득
   * 3. 여러 경로 옵션 제공으로 사용자 선택권 확대
   * 4. 시간대별 검색 지원 (지금 출발/특정 시간 출발/특정 시간 도착)
   */
  const handleRouteSearch = useCallback(async () => {
    if (!departureLocation || !destinationLocation) {
      setRouteError("출발지와 목적지를 모두 선택해주세요.");
      return;
    }

    setIsSearchingRoute(true);
    setRouteError("");

    try {
      console.log("길찾기 검색 시작:", {
        departure: departureLocation.name,
        destination: destinationLocation.name,
        timeOption,
        selectedDateTime,
      });

      // 출발 시간 계산
      let departureTime: Date;

      if (timeOption === "now") {
        departureTime = new Date();
      } else if (timeOption === "depart" && selectedDateTime) {
        departureTime = new Date(selectedDateTime);
      } else if (timeOption === "arrive" && selectedDateTime) {
        // 도착 시간이 지정된 경우, 약 1시간 전을 출발 시간으로 설정 (임시)
        // 실제로는 Directions API의 arrival_time 파라미터를 사용해야 함
        departureTime = new Date(
          new Date(selectedDateTime).getTime() - 60 * 60 * 1000
        );
      } else {
        departureTime = new Date();
      }

      // 실제 Google Directions API 호출
      const routes = await searchTransitRoutes({
        departure: departureLocation,
        destination: destinationLocation,
        departureTime,
        arrivalTime:
          timeOption === "arrive" && selectedDateTime
            ? new Date(selectedDateTime)
            : undefined,
      });

      console.log("길찾기 결과:", routes);
      setRouteResults(routes);

      if (routes.length === 0) {
        setRouteError(
          "대중교통 경로를 찾을 수 없습니다. 다른 경로를 시도해보세요."
        );
      }
    } catch (error) {
      console.error("길찾기 오류:", error);
      setRouteError(
        error instanceof Error
          ? error.message
          : "길찾기 중 오류가 발생했습니다."
      );
    } finally {
      setIsSearchingRoute(false);
    }
  }, [departureLocation, destinationLocation, timeOption, selectedDateTime]);

  /**
   * 검색 결과 패널 닫기
   */
  const handleCloseSearchResults = useCallback(() => {
    setIsSearchResultsOpen(false);
  }, []);

  /**
   * 검색 결과 전체 지우기
   */
  const handleClearSearchResults = useCallback(() => {
    setSearchResults([]);
    setIsSearchResultsOpen(false);
  }, []);

  /**
   * 일정에 경로 추가 (개선된 버전 - TransportSection 연동)
   */
  const handleAddRouteToSchedule = useCallback(
    (route: RouteResult) => {
      // 일정에 추가
      addRouteToSchedule(route);
      console.log("경로를 일정에 추가:", route);

      // TransportSection의 localStorage에도 저장
      try {
        const savedRoutes = JSON.parse(
          localStorage.getItem("savedRoutes") || "[]"
        );

        const newSavedRoute = {
          id: `route_${Date.now()}`,
          departure: route.departure,
          destination: route.destination,
          departureTime: route.departureTime,
          arrivalTime: route.arrivalTime,
          duration: route.duration,
          transfers: route.transfers,
          price: route.price || 0,
          mode: "TRANSIT" as const,
          route: route.route,
          savedAt: new Date().toISOString(),
        };

        // 중복 체크 (같은 출발지-목적지-시간대 조합)
        const isDuplicate = savedRoutes.some(
          (saved: any) =>
            saved.departure === route.departure &&
            saved.destination === route.destination &&
            saved.departureTime === route.departureTime
        );

        if (!isDuplicate) {
          const updatedRoutes = [newSavedRoute, ...savedRoutes];
          localStorage.setItem("savedRoutes", JSON.stringify(updatedRoutes));
          console.log("길찾기 결과가 교통 정보에 자동 저장됨:", newSavedRoute);
        } else {
          console.log(
            "이미 저장된 경로입니다:",
            route.departure,
            "->",
            route.destination
          );
        }
      } catch (error) {
        console.error("교통 정보 저장 실패:", error);
      }
    },
    [addRouteToSchedule]
  );

  // ========================
  // 렌더링 함수들
  // ========================

  /**
   * 검색 결과 패널 렌더링
   */
  const renderSearchResults = () => (
    <Drawer
      anchor="left"
      variant="persistent"
      open={searchResults.length > 0 && isSearchResultsOpen}
      sx={{
        width: 400,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 400,
          boxSizing: "border-box",
          top: 64, // 헤더 높이만큼 아래로
          height: "calc(100vh - 64px)",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* 검색 결과 헤더 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            검색 결과 ({searchResults.length}개)
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            {/* 전체 지우기 버튼 */}
            <IconButton
              size="small"
              onClick={handleClearSearchResults}
              title="모두 지우기"
              sx={{ color: "text.secondary" }}
            >
              <ClearIcon />
            </IconButton>

            {/* 닫기 버튼 */}
            <IconButton
              size="small"
              onClick={handleCloseSearchResults}
              title="패널 닫기"
              sx={{ color: "text.secondary" }}
            >
              <VisibilityOffIcon />
            </IconButton>
          </Box>
        </Box>

        {searchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {searchError}
          </Alert>
        )}

        <List>
          {searchResults.map((result) => (
            <React.Fragment key={result.id}>
              <ListItem alignItems="flex-start">
                <Card sx={{ width: "100%" }}>
                  {result.photoUrl && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={result.photoUrl}
                      alt={result.name}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {result.name}
                    </Typography>

                    {result.rating && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Rating
                          value={result.rating}
                          readOnly
                          precision={0.1}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {result.rating}
                        </Typography>
                      </Box>
                    )}

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {result.address}
                    </Typography>

                    <Box
                      sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleSearchResultSelect(result)}
                      >
                        지도에서 보기
                      </Button>

                      {/* **길찾기 버튼 추가** */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DirectionsIcon />}
                        onClick={() => {handleRouteFromSearchResult(result)}}
                        sx={{ color: "#ff5722", borderColor: "#ff5722" }}
                      >
                        길찾기
                      </Button>
                      {/* **구글맵에서 보기 버튼 추가** */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() =>
                          window.open(
                            `https://maps.google.com/maps?place_id=${result.placeId}`,
                            "_blank"
                          )
                        }
                        sx={{ color: "#4285f4", borderColor: "#4285f4" }}
                      >
                        구글맵에서 보기
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          handleAddLocationToSchedule(result);
                          handleClearSearchResults();
                        }}
                      >
                        일정 추가
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  /**
   * 길찾기 패널 렌더링 (개선된 버전)
   */
  const renderRoutePanel = () => (
    <Drawer
      anchor="right"
      open={isRoutePanelOpen}
      onClose={toggleRoutePanel}
      sx={{
        width: 400,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 400,
          boxSizing: "border-box",
          top: 64,
          height: "calc(100vh - 64px)",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">길찾기</Typography>
          <IconButton onClick={toggleRoutePanel}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 출발지 입력 */}
        <Box sx={{ mb: 2 }}>
          <PlaceSearchInput
            label="출발지"
            value={departureLocation}
            onLocationSelect={setDepartureLocation}
            placeholder="출발지를 검색하세요 (예: 강남역)"
          />

          {/* 현재 위치 바로가기 버튼 */}
          {!departureLocation && (
            <Button
              fullWidth
              size="small"
              startIcon={<MyLocationIcon />}
              onClick={handleSetCurrentLocationAsDeparture}
              variant="outlined"
              sx={{
                mt: 1,
                borderStyle: "dashed",
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderStyle: "solid",
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                },
              }}
            >
              현재 위치로 설정
            </Button>
          )}
        </Box>

        {/* 출발지↔목적지 교체 버튼 */}
        <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
          <IconButton
            onClick={swapDepartureAndDestination}
            disabled={!departureLocation && !destinationLocation}
            sx={{
              backgroundColor: "rgba(25, 118, 210, 0.08)",
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.16)",
              },
              "&:disabled": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
            title="출발지와 목적지 교체"
          >
            <SwapVertIcon
              color={
                departureLocation || destinationLocation
                  ? "primary"
                  : "disabled"
              }
            />
          </IconButton>
        </Box>

        {/* 목적지 입력 */}
        <Box sx={{ mb: 2 }}>
          <PlaceSearchInput
            label="목적지"
            value={destinationLocation}
            onLocationSelect={setDestinationLocation}
            placeholder="목적지를 검색하세요 (예: 홍대입구역)"
          />
        </Box>

        {/* 시간 설정 옵션 */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>출발 시간 옵션</InputLabel>
            <Select
              value={timeOption}
              label="출발 시간 옵션"
              onChange={(e) =>
                setTimeOption(e.target.value as "now" | "depart" | "arrive")
              }
            >
              <MenuItem value="now">지금 출발</MenuItem>
              <MenuItem value="depart">출발 시간 지정</MenuItem>
              <MenuItem value="arrive">도착 시간 지정</MenuItem>
            </Select>
          </FormControl>

          {/* 시간 선택 필드 */}
          <Collapse in={timeOption !== "now"}>
            <TextField
              fullWidth
              type="datetime-local"
              label={timeOption === "depart" ? "출발 시간" : "도착 시간"}
              value={selectedDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
              sx={{ mt: 1 }}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: new Date().toISOString().slice(0, 16), // 현재 시간 이후만 선택 가능
              }}
            />
          </Collapse>
        </Box>

        {/* 에러 메시지 */}
        {routeError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {routeError}
          </Alert>
        )}

        {/* 검색 버튼 */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<DirectionsIcon />}
          onClick={handleRouteSearch}
          disabled={
            !departureLocation || !destinationLocation || isSearchingRoute
          }
          sx={{ mb: 3 }}
        >
          {isSearchingRoute ? "검색 중..." : "길찾기"}
        </Button>

        {routeResults.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              경로 결과 ({routeResults.length}개)
            </Typography>

            {routeResults.map((route, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  {/* 경로 요약 정보 */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={`${route.duration}분`}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      icon={<DirectionsBusIcon />}
                      label={`환승 ${route.transfers}회`}
                      size="small"
                      color="secondary"
                    />
                  </Box>

                  {/* 시간 정보 */}
                  <Typography variant="body2" gutterBottom>
                    {formatTimeTo24Hour(route.departureTime)} →{" "}
                    {formatTimeTo24Hour(route.arrivalTime)}
                  </Typography>

                  {/* 상세 경로 정보 */}
                  {route.route.length > 0 && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1,
                        backgroundColor: "grey.50",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                      >
                        상세 경로:
                      </Typography>
                      {route.route.map((step, stepIndex) => {
                        // 교통수단별 한글 표시 및 색상
                        const getTransportInfo = (mode: string) => {
                          switch (mode) {
                            case "SUBWAY":
                              return {
                                label: "지하철",
                                color: "info" as const,
                              };
                            case "BUS":
                              return {
                                label: "버스",
                                color: "warning" as const,
                              };
                            case "TRAIN":
                              return {
                                label: "기차",
                                color: "success" as const,
                              };
                            case "TRAM":
                              return {
                                label: "전차",
                                color: "secondary" as const,
                              };
                            case "HEAVY_RAIL":
                              return {
                                label: "기차",
                                color: "success" as const,
                              };
                            case "COMMUTER_TRAIN":
                              return {
                                label: "통근열차",
                                color: "success" as const,
                              };
                            case "HIGH_SPEED_TRAIN":
                              return {
                                label: "고속철도",
                                color: "success" as const,
                              };
                            case "WALKING":
                              return {
                                label: "도보",
                                color: "default" as const,
                              };
                            default:
                              return { label: mode, color: "default" as const };
                          }
                        };

                        const transportInfo = getTransportInfo(step.mode);

                        return (
                          <Box
                            key={stepIndex}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <Chip
                              label={transportInfo.label}
                              size="small"
                              color={transportInfo.color}
                              sx={{ mr: 1, minWidth: 50 }}
                            />
                            <Typography variant="caption">
                              {step.line} ({step.departure}{" "}
                              {formatTimeTo24Hour(step.departureTime)} →{" "}
                              {step.arrival}{" "}
                              {formatTimeTo24Hour(step.arrivalTime)})
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {/* 일정 추가 버튼 */}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {handleAddRouteToSchedule(route);
                      handleClearSearchResults();
                      toggleRoutePanel();
                      //이동
                    }}
                    sx={{ mt: 2 }}
                  >
                    일정에 추가
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Drawer>
  );

  // ========================
  // 메인 렌더링
  // ========================
  return (
    <GoogleMapsLoader>
      <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
        {/* 지도 영역 */}
        <GoogleMapContainer
          selectedLocation={selectedLocation}
          markers={mapMarkers}
          onLocationSelect={handleMapLocationSelect}
          mapCenter={mapCenter}
        >
          {/* 검색창 */}
          <MapSearchBox
            onPlaceSelect={handlePlaceSelect}
            onCurrentLocation={handleCurrentLocation}
          />

          {/* 길찾기 버튼 */}
          <IconButton
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              backgroundColor: "white",
              boxShadow: 2,
              "&:hover": { backgroundColor: "grey.100" },
            }}
            onClick={toggleRoutePanel}
          >
            <DirectionsIcon />
          </IconButton>

          {/* 검색 결과 패널 열기 버튼 (검색 결과가 있지만 패널이 닫혀있을 때) */}
          {searchResults.length > 0 && !isSearchResultsOpen && (
            <IconButton
              sx={{
                position: "absolute",
                top: 70,
                right: 16,
                backgroundColor: "white",
                boxShadow: 2,
                "&:hover": { backgroundColor: "grey.100" },
              }}
              onClick={() => setIsSearchResultsOpen(true)}
              title={`검색 결과 ${searchResults.length}개 보기`}
            >
              <ListIcon />
            </IconButton>
          )}
        </GoogleMapContainer>

        {/* 검색 결과 패널 (왼쪽) */}
        {renderSearchResults()}

        {/* 길찾기 패널 (오른쪽) */}
        {renderRoutePanel()}
      </Box>
    </GoogleMapsLoader>
  );
};

export default Maps;
