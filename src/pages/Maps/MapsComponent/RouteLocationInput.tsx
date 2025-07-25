import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  Typography,
  Popper,
  ClickAwayListener,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocationOn as LocationOnIcon,
  ExpandMore as ExpandMoreIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { LocationData } from '../../../types/travel';
import { convertPlaceToLocationData } from '../../../utils/travelUtils';

/**
 * 검색 결과 항목 인터페이스
 */
interface SearchResultItem {
  placeId: string;
  name: string;
  address: string;
  types: string[];
}

/**
 * RouteLocationInput Props
 */
interface RouteLocationInputProps {
  label: string;
  value: LocationData | null;
  onLocationSelect: (location: LocationData | null) => void;
  placeholder?: string;
  searchResults?: LocationData[]; // 외부 검색 결과에서 선택 가능
  disabled?: boolean;
}

/**
 * 구글맵 스타일의 길찾기용 위치 입력 컴포넌트
 * 
 * 기능:
 * 1. 실시간 검색 결과 표시 (구글맵 스타일)
 * 2. 외부 검색 결과에서도 선택 가능
 * 3. 선택된 위치 표시 및 삭제
 * 4. 현재 위치 사용 기능
 * 
 * PlaceSearchInput과의 차이점:
 * - 외부 검색 결과에서 선택할 수 있는 기능 추가
 * - 현재 위치 사용 버튼 추가
 * - 길찾기에 최적화된 UX
 */
const RouteLocationInput: React.FC<RouteLocationInputProps> = ({
  label,
  value,
  onLocationSelect,
  placeholder = `${label}을 검색하세요`,
  searchResults = [],
  disabled = false
}) => {
  // 상태 관리
  const [inputValue, setInputValue] = useState<string>('');
  const [internalSearchResults, setInternalSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // 외부 검색 결과 메뉴 상태
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isExternalMenuOpen = Boolean(anchorEl);
  
  // 참조
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  
  // 디바운싱을 위한 타이머
  const searchTimeoutRef = useRef<number | null>(null);

  /**
   * 장소 검색 실행 (구글맵 스타일)
   */
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setInternalSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Places Service 초기화
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request: google.maps.places.TextSearchRequest = {
        query: query,
        // 한국 지역으로 검색 제한
        location: new google.maps.LatLng(37.5665, 126.9780), // 서울 중심
        radius: 50000, // 50km 반경
        language: 'ko'
      };

      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const searchItems: SearchResultItem[] = results
            .slice(0, 8) // 최대 8개 결과만 표시
            .map(place => ({
              placeId: place.place_id || '',
              name: place.name || '',
              address: place.formatted_address || '',
              types: place.types || []
            }))
            .filter(item => item.placeId && item.name); // 유효한 결과만 필터링

          setInternalSearchResults(searchItems);
          setIsDropdownOpen(searchItems.length > 0);
        } else {
          console.warn('Places search failed:', status);
          setInternalSearchResults([]);
          setIsDropdownOpen(false);
          
          if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setError('검색 결과가 없습니다.');
          } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setError('검색 권한이 없습니다. API 설정을 확인해주세요.');
          } else {
            setError('검색 중 오류가 발생했습니다.');
          }
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Search error:', error);
      setError('검색 중 오류가 발생했습니다.');
      setIsSearching(false);
      setInternalSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, []);

  /**
   * 검색어 입력 처리 (디바운싱 적용)
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setError('');

    // 기존 타이머 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 300ms 후 검색 실행 (디바운싱)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(newValue);
    }, 300);
  }, [performSearch]);

  /**
   * 검색 결과 선택 처리
   */
  const handleSelectPlace = useCallback(async (item: SearchResultItem) => {
    setIsSearching(true);
    setIsDropdownOpen(false);
    setInputValue('');

    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: item.placeId,
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

      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData = convertPlaceToLocationData(place);
          onLocationSelect(locationData);
        } else {
          console.error('Place details failed:', status);
          setError('장소 정보를 가져올 수 없습니다.');
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Place details error:', error);
      setError('장소 선택 중 오류가 발생했습니다.');
      setIsSearching(false);
    }
  }, [onLocationSelect]);

  /**
   * 외부 검색 결과에서 위치 선택
   */
  const handleSelectFromExternal = useCallback((location: LocationData) => {
    onLocationSelect(location);
    setAnchorEl(null);
  }, [onLocationSelect]);

  /**
   * 현재 위치 사용
   */
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsSearching(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 현재 위치를 주소로 변환 (Reverse Geocoding)
          const geocoder = new google.maps.Geocoder();
          const request: google.maps.GeocoderRequest = {
            location: { lat: latitude, lng: longitude }
          };

          geocoder.geocode(request, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
              const place = results[0];
              const locationData: LocationData = {
                name: '현재 위치',
                link: `https://maps.google.com/?q=${latitude},${longitude}`,
                placeId: place.place_id || `current_${Date.now()}`,
                address: place.formatted_address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                coordinates: {
                  lat: latitude,
                  lng: longitude
                }
              };
              
              onLocationSelect(locationData);
            } else {
              // Geocoding 실패 시 좌표만으로 LocationData 생성
              const locationData: LocationData = {
                name: '현재 위치',
                link: `https://maps.google.com/?q=${latitude},${longitude}`,
                placeId: `current_${Date.now()}`,
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                coordinates: {
                  lat: latitude,
                  lng: longitude
                }
              };
              
              onLocationSelect(locationData);
            }
            setIsSearching(false);
          });
        } catch (error) {
          console.error('Current location error:', error);
          setError('현재 위치를 처리하는 중 오류가 발생했습니다.');
          setIsSearching(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('현재 위치를 가져올 수 없습니다.');
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분 캐시
      }
    );
  }, [onLocationSelect]);

  /**
   * 선택된 위치 삭제
   */
  const handleClearSelection = useCallback(() => {
    onLocationSelect(null);
    setInputValue('');
    setInternalSearchResults([]);
    setIsDropdownOpen(false);
    setError('');
  }, [onLocationSelect]);

  /**
   * 검색창 포커스 처리
   */
  const handleInputFocus = useCallback(() => {
    if (internalSearchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  }, [internalSearchResults.length]);

  /**
   * 외부 클릭 시 검색 결과 닫기
   */
  const handleClickAway = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  /**
   * 엔터키 처리
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (internalSearchResults.length > 0) {
        handleSelectPlace(internalSearchResults[0]); // 첫 번째 결과 선택
      }
    }
  }, [internalSearchResults, handleSelectPlace]);

  /**
   * 외부 검색 결과 메뉴 열기
   */
  const handleOpenExternalMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  /**
   * 외부 검색 결과 메뉴 닫기
   */
  const handleCloseExternalMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  /**
   * 컴포넌트 언마운트 시 타이머 정리
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * 장소 타입을 한국어로 변환
   */
  const getPlaceTypeText = (types: string[]): string => {
    const typeMap: Record<string, string> = {
      'subway_station': '지하철역',
      'bus_station': '버스정류장', 
      'train_station': '기차역',
      'airport': '공항',
      'restaurant': '식당',
      'tourist_attraction': '관광지',
      'shopping_mall': '쇼핑몰',
      'hospital': '병원',
      'school': '학교',
      'university': '대학교',
      'park': '공원',
      'establishment': '시설'
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }
    return '장소';
  };

  return (
    <Box sx={{ mb: 2 }} ref={anchorRef}>
      {/* 선택된 위치 표시 */}
      {value ? (
        <Box>
          <Chip
            icon={<LocationOnIcon />}
            label={value.name}
            onDelete={handleClearSelection}
            deleteIcon={<ClearIcon />}
            variant="outlined"
            sx={{ 
              maxWidth: '100%',
              '& .MuiChip-label': {
                maxWidth: '280px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {value.address}
          </Typography>
        </Box>
      ) : (
        /* 검색 입력 필드 */
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              ref={inputRef}
              fullWidth
              label={label}
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyPress={handleKeyPress}
              disabled={disabled || isSearching}
              error={!!error}
              helperText={error}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {isSearching ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SearchIcon color="action" />
                    )}
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {/* 현재 위치 사용 버튼 */}
                      <IconButton
                        size="small"
                        onClick={handleUseCurrentLocation}
                        disabled={isSearching}
                        title="현재 위치 사용"
                      >
                        <MyLocationIcon />
                      </IconButton>
                      
                      {/* 외부 검색 결과에서 선택 버튼 */}
                      {searchResults.length > 0 && (
                        <IconButton
                          size="small"
                          onClick={handleOpenExternalMenu}
                          title={`최근 검색 결과에서 선택 (${searchResults.length}개)`}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      )}
                      
                      {/* 입력 필드 지우기 버튼 */}
                      {inputValue && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setInputValue('');
                            setInternalSearchResults([]);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <ClearIcon />
                        </IconButton>
                      )}
                    </Box>
                  </InputAdornment>
                )
              }}
            />

            {/* 검색 결과 드롭다운 */}
            <Popper
              open={isDropdownOpen && internalSearchResults.length > 0}
              anchorEl={anchorRef.current}
              placement="bottom-start"
              style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth }}
            >
              <Paper elevation={8} sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {internalSearchResults.map((item) => (
                    <ListItem key={item.placeId} disablePadding>
                      <ListItemButton
                        onClick={() => handleSelectPlace(item)}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <LocationOnIcon color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" noWrap>
                              {item.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {item.address}
                              </Typography>
                              <Chip 
                                label={getPlaceTypeText(item.types)}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1, fontSize: '0.7rem', height: 18 }}
                              />
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Popper>

            {/* 외부 검색 결과 메뉴 */}
            <Menu
              anchorEl={anchorEl}
              open={isExternalMenuOpen}
              onClose={handleCloseExternalMenu}
              PaperProps={{
                sx: { maxHeight: 300, width: anchorRef.current?.offsetWidth }
              }}
            >
              <MenuItem disabled>
                <Typography variant="caption" color="text.secondary">
                  최근 검색 결과에서 선택
                </Typography>
              </MenuItem>
              {searchResults.slice(0, 10).map((location, index) => (
                <MenuItem
                  key={location.placeId || index}
                  onClick={() => handleSelectFromExternal(location)}
                >
                  <ListItemIcon>
                    <LocationOnIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.name}
                    secondary={location.address}
                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                  />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </ClickAwayListener>
      )}
    </Box>
  );
};

export default RouteLocationInput;