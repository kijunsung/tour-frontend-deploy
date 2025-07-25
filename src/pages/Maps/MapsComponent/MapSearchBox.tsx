import React, { useCallback, useRef, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { DEFAULT_AUTOCOMPLETE_OPTIONS } from '../../../types/googleMaps';
import { LocationData } from '../../../types/travel';
import { convertPlaceToLocationData } from '../../../utils/travelUtils';

/**
 * MapSearchBox Props
 */
interface MapSearchBoxProps {
  onPlaceSelect: (location: LocationData) => void;
  onCurrentLocation?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Google Places Autocomplete 검색창 컴포넌트
 * 
 * 역할:
 * 1. Google Places Autocomplete API 연동
 * 2. 실시간 장소 검색 및 자동완성
 * 3. 현재 위치 버튼 제공
 * 4. 선택된 장소 정보를 상위 컴포넌트에 전달
 */
const MapSearchBox: React.FC<MapSearchBoxProps> = ({
  onPlaceSelect,
  onCurrentLocation,
  placeholder = "여행지, 레스토랑, 명소 검색...",
  disabled = false
}) => {
  // Autocomplete 인스턴스 참조
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // 검색어 상태
  const [searchValue, setSearchValue] = useState<string>('');
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 에러 상태
  const [error, setError] = useState<string>('');

  /**
   * Autocomplete 로드 완료 시 콜백
   */
  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    
    // Autocomplete 옵션 설정
    autocomplete.setOptions({
      ...DEFAULT_AUTOCOMPLETE_OPTIONS,
      types: ["establishment", "geocode"] as string[],
    });
    
    console.log('Autocomplete 로드 완료');
  }, []);

  /**
   * 장소 선택 시 콜백
   */
  const onPlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) return;
    
    setIsLoading(true);
    setError('');

    try {
      const place = autocompleteRef.current.getPlace();
      
      // 장소 정보 유효성 검사
      if (!place || !place.place_id || !place.geometry) {
        setError('선택한 장소의 정보를 가져올 수 없습니다.');
        setIsLoading(false);
        return;
      }

      console.log('선택된 장소:', place);

      // LocationData로 변환
      const locationData = convertPlaceToLocationData(place);
      
      // 검색창 값 업데이트
      setSearchValue(place.name || place.formatted_address || '');
      
      // 상위 컴포넌트에 전달
      onPlaceSelect(locationData);
      
    } catch (error) {
      console.error('장소 선택 처리 중 오류:', error);
      setError('장소 선택 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [onPlaceSelect]);

  /**
   * 검색어 변경 핸들러
   */
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setError(''); // 에러 초기화
  }, []);

  /**
   * 검색어 초기화
   */
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setError('');
  }, []);

  /**
   * 현재 위치 요청
   */
  const handleCurrentLocation = useCallback(() => {
    if (!onCurrentLocation) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      onCurrentLocation();
    } catch (error) {
      console.error('현재 위치 요청 오류:', error);
      setError('현재 위치를 가져올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [onCurrentLocation]);

  /**
   * 엔터키 처리 (검색 실행)
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // 자동완성이 없을 때 수동 검색 실행
      if (searchValue.trim() && !autocompleteRef.current?.getPlace()?.place_id) {
        handleManualSearch();
      }
    }
  }, [searchValue]);

  /**
   * 수동 검색 (엔터키 또는 버튼 클릭 시)
   */
  const handleManualSearch = useCallback(async () => {
    if (!searchValue.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Google Places Text Search API 사용
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request: google.maps.places.TextSearchRequest = {
        query: searchValue
      };
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          console.log('수동 검색 결과:', place);
          
          // LocationData로 변환
          const locationData = convertPlaceToLocationData(place);
          
          // 검색창 값 업데이트
          setSearchValue(place.name || place.formatted_address || '');
          
          // 상위 컴포넌트에 전달
          onPlaceSelect(locationData);
        } else {
          setError('검색 결과를 찾을 수 없습니다.');
        }
        setIsLoading(false);
      });
      
    } catch (error) {
      console.error('수동 검색 오류:', error);
      setError('검색 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [searchValue, onPlaceSelect]);

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: { xs: '90%', sm: '400px' },
        maxWidth: '500px'
      }}
      elevation={3}
    >
      <Autocomplete
        onLoad={onAutocompleteLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          strictBounds: false,
          types: ['establishment', 'geocode']
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton 
                    onClick={searchValue.trim() ? handleManualSearch : undefined}
                    disabled={!searchValue.trim() || disabled || isLoading}
                    size="small"
                  >
                    <SearchIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchValue && (
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    disabled={disabled || isLoading}
                  >
                    <ClearIcon />
                  </IconButton>
                )}
                {onCurrentLocation && (
                  <IconButton
                    size="small"
                    onClick={handleCurrentLocation}
                    disabled={disabled || isLoading}
                    title="현재 위치"
                  >
                    <MyLocationIcon />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper'
            }
          }}
        />
      </Autocomplete>
      
      {/* 에러 메시지 */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 1 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default MapSearchBox;
