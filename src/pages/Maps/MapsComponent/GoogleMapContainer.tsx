import React, { useCallback, useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Box } from '@mui/material';
import { DEFAULT_MAP_CONFIG } from '../../../types/googleMaps';
import { LocationData } from '../../../types/travel';

/**
 * Google Map 컨테이너 스타일
 */
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
} as const;

/**
 * Google Map 옵션 (사용자 인터페이스 설정)
 */
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false, // 기본 UI 표시
  zoomControl: true,       // 줌 컨트롤
  streetViewControl: false, // 스트리트 뷰 비활성화
  fullscreenControl: false, // 전체화면 버튼 비활성화
  mapTypeControl: false,   // 지도 타입 선택 비활성화
  gestureHandling: 'greedy', // 터치 제스처 모두 허용
  clickableIcons: true,    // POI 클릭 가능
} as const;

/**
 * GoogleMapContainer Props
 */
interface GoogleMapContainerProps {
  selectedLocation?: LocationData | null;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  onLocationSelect?: (location: LocationData) => void;
  markers?: LocationData[];
  children?: React.ReactNode;
  // 지도 중심 이동을 위한 새로운 prop 추가
  mapCenter?: { lat: number; lng: number } | null;
}

/**
 * Google Map 컨테이너 컴포넌트
 * 
 * 역할:
 * 1. Google Maps 지도 렌더링
 * 2. 마커 표시 및 관리
 * 3. 지도 클릭 이벤트 처리
 * 4. InfoWindow 표시
 */
const GoogleMapContainer: React.FC<GoogleMapContainerProps> = ({
  selectedLocation,
  onMapClick,
  onLocationSelect,
  markers = [],
  children,
  mapCenter = null
}) => {
  // 지도 인스턴스 참조
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // InfoWindow 관련 상태
  const [activeMarker, setActiveMarker] = useState<LocationData | null>(null);

  /**
   * 지도 로드 완료 시 콜백
   */
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    console.log('지도 로드 완료:', map);
  }, []);

  /**
   * 지도 중심 이동 처리
   * mapCenter prop이 변경될 때마다 지도 중심을 이동
   */
  useEffect(() => {
    if (mapRef.current && mapCenter) {
      console.log('지도 중심 이동:', mapCenter);
      mapRef.current.panTo(mapCenter);
      // 줌 레벨도 적절히 조정 (선택사항)
      mapRef.current.setZoom(15);
    }
  }, [mapCenter]);

  /**
   * 지도 언마운트 시 콜백
   */
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
    console.log('지도 언마운트');
  }, []);

  /**
   * 지도 클릭 이벤트 핸들러
   */
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    // InfoWindow 닫기
    setActiveMarker(null);
    
    // 상위 컴포넌트에 클릭 이벤트 전달
    if (onMapClick) {
      onMapClick(event);
    }
  }, [onMapClick]);

  /**
   * 마커 클릭 이벤트 핸들러
   */
  const handleMarkerClick = useCallback((location: LocationData) => {
    setActiveMarker(location);
    
    // 지도 중심을 마커로 이동
    if (mapRef.current) {
      mapRef.current.panTo({
        lat: location.coordinates.lat,
        lng: location.coordinates.lng
      });
    }
    
    // 상위 컴포넌트에 선택 이벤트 전달
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

  /**
   * InfoWindow 닫기 핸들러
   */
  const handleInfoWindowClose = useCallback(() => {
    setActiveMarker(null);
  }, []);

  /**
   * 마커 아이콘 생성
   */
  const createMarkerIcon = (isSelected: boolean = false): google.maps.Icon => {
    return {
      url: isSelected 
        ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'  // 선택된 마커 (빨간색)
        : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', // 일반 마커 (파란색)
      scaledSize: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(16, 32),
    };
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={DEFAULT_MAP_CONFIG.center}
        zoom={DEFAULT_MAP_CONFIG.zoom}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        onClick={handleMapClick}
      >
        {/* 일반 마커들 렌더링 */}
        {markers.map((location, index) => (
          <Marker
            key={`${location.placeId}-${index}`}
            position={{
              lat: location.coordinates.lat,
              lng: location.coordinates.lng
            }}
            title={location.name}
            icon={createMarkerIcon(false)}
            onClick={() => handleMarkerClick(location)}
          />
        ))}

        {/* 선택된 위치 마커 (특별 표시) */}
        {selectedLocation && (
          <Marker
            position={{
              lat: selectedLocation.coordinates.lat,
              lng: selectedLocation.coordinates.lng
            }}
            title={`선택됨: ${selectedLocation.name}`}
            icon={createMarkerIcon(true)}
            onClick={() => handleMarkerClick(selectedLocation)}
          />
        )}

        {/* 간소화된 InfoWindow 표시 */}
        {activeMarker && (
          <InfoWindow
            position={{
              lat: activeMarker.coordinates.lat,
              lng: activeMarker.coordinates.lng
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <Box sx={{ p: 1, minWidth: 150, maxWidth: 250 }}>
              <Box sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.9rem' }}>
                {activeMarker.name}
              </Box>
              {activeMarker.rating && (
                <Box sx={{ fontSize: '0.8rem', color: '#f57c00', mb: 0.5 }}>
                  ⭐ {activeMarker.rating.toFixed(1)}
                </Box>
              )}
              <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                클릭하여 자세히 보기
              </Box>
            </Box>
          </InfoWindow>
        )}

        {/* 추가 자식 컴포넌트들 (검색창 등) */}
        {children}
      </GoogleMap>
    </Box>
  );
};

export default GoogleMapContainer;
