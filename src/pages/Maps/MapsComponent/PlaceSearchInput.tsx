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
  ListItemIcon,
  Paper,
  CircularProgress,
  Typography,
  Popper,
  ClickAwayListener
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { LocationData } from '../../../types/travel';
import { convertPlaceToLocationData } from '../../../utils/travelUtils';

/**
 * 자동완성 제안 항목 인터페이스
 */
interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

/**
 * PlaceSearchInput Props
 */
interface PlaceSearchInputProps {
  label: string;
  value: LocationData | null;
  onLocationSelect: (location: LocationData | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 구글맵 자동완성 스타일의 장소 검색 입력 컴포넌트
 * 
 * 수정된 구현 방식:
 * 1. Google Places Autocomplete Predictions API 사용 (실제 검색 X, 제안만)
 * 2. 사용자가 제안에서 선택하면 Place Details API로 상세 정보 획득
 * 3. 구글맵 검색창과 동일한 UX 제공
 * 
 * 왜 이렇게 수정했나:
 * - Text Search API는 실제 검색을 수행해서 무거움
 * - Autocomplete Predictions API는 가벼운 제안만 제공
 * - 사용자 경험 개선: 타이핑하면서 즉시 관련 제안 확인 가능
 * - API 호출 비용 절약: 실제 선택 시에만 상세 정보 요청
 */
const PlaceSearchInput: React.FC<PlaceSearchInputProps> = ({
  label,
  value,
  onLocationSelect,
  placeholder = `${label}을 검색하세요`,
  disabled = false
}) => {
  // 상태 관리
  const [inputValue, setInputValue] = useState<string>('');
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState<boolean>(false);
  const [isSelectingPlace, setIsSelectingPlace] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // 참조
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  
  // Autocomplete Service 인스턴스
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  
  // 디바운싱을 위한 타이머
  const predictionsTimeoutRef = useRef<number | null>(null);

  /**
   * Autocomplete Service 초기화
   */
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
  }, []);

  /**
   * 자동완성 제안 가져오기
   * 
   * 수정된 구현 방식:
   * 1. Google Places Autocomplete Predictions API 사용
   * 2. 실제 검색이 아닌 입력어 기반 제안만 제공
   * 3. 빠른 응답으로 실시간 자동완성 경험 제공
   */
  const getPredictions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2 || !autocompleteServiceRef.current) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoadingPredictions(true);
    setError('');

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        // 한국 지역으로 제한
        componentRestrictions: { country: 'KR' },
        // 장소 유형 제한 (시설물, 주소)
        types: ['establishment', 'geocode'],
        // 언어 설정
        language: 'ko',
        // 지역 편향 (서울 중심)
        location: new google.maps.LatLng(37.5665, 126.9780),
        radius: 50000 // 50km 반경
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const formattedPredictions: AutocompletePrediction[] = predictions
              .slice(0, 8) // 최대 8개 제안
              .map(prediction => ({
                placeId: prediction.place_id,
                description: prediction.description,
                mainText: prediction.structured_formatting?.main_text || prediction.description,
                secondaryText: prediction.structured_formatting?.secondary_text || '',
                types: prediction.types || []
              }));

            setPredictions(formattedPredictions);
            setIsOpen(formattedPredictions.length > 0);
          } else {
            console.warn('Autocomplete predictions failed:', status);
            setPredictions([]);
            setIsOpen(false);
            
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              // ZERO_RESULTS는 에러로 표시하지 않음 (자연스러운 상황)
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              setError('검색 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
            } else {
              setError('검색 제안을 가져올 수 없습니다.');
            }
          }
          setIsLoadingPredictions(false);
        }
      );
    } catch (error) {
      console.error('Predictions error:', error);
      setError('검색 제안 중 오류가 발생했습니다.');
      setIsLoadingPredictions(false);
      setPredictions([]);
      setIsOpen(false);
    }
  }, []);

  /**
   * 검색어 입력 처리 (디바운싱 적용)
   * 
   * 수정사항:
   * 1. 디바운싱 시간을 300ms → 150ms로 단축
   * 2. 더 빠른 자동완성 반응성 제공
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setError('');

    // 기존 타이머 취소
    if (predictionsTimeoutRef.current) {
      clearTimeout(predictionsTimeoutRef.current);
    }

    // 150ms 후 자동완성 제안 요청 (더 빠른 반응)
    predictionsTimeoutRef.current = setTimeout(() => {
      getPredictions(newValue);
    }, 150);
  }, [getPredictions]);

  /**
   * 자동완성 제안 선택 처리
   * 
   * 수정된 구현 방식:
   * 1. 제안 선택 시에만 Place Details API 호출
   * 2. 실제 장소 정보 획득 후 LocationData로 변환
   * 3. API 호출 최소화로 비용 절약 및 성능 향상
   */
  const handleSelectPrediction = useCallback(async (prediction: AutocompletePrediction) => {
    setIsSelectingPlace(true);
    setIsOpen(false);
    setInputValue('');
    setPredictions([]);

    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.placeId,
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
        setIsSelectingPlace(false);
      });
    } catch (error) {
      console.error('Place details error:', error);
      setError('장소 선택 중 오류가 발생했습니다.');
      setIsSelectingPlace(false);
    }
  }, [onLocationSelect]);

  /**
   * 선택된 위치 삭제
   */
  const handleClearSelection = useCallback(() => {
    onLocationSelect(null);
    setInputValue('');
    setPredictions([]);
    setIsOpen(false);
    setError('');
  }, [onLocationSelect]);

  /**
   * 검색창 포커스 처리
   */
  const handleInputFocus = useCallback(() => {
    if (predictions.length > 0) {
      setIsOpen(true);
    }
  }, [predictions.length]);

  /**
   * 외부 클릭 시 자동완성 제안 닫기
   */
  const handleClickAway = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * 엔터키 처리
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (predictions.length > 0) {
        handleSelectPrediction(predictions[0]); // 첫 번째 제안 선택
      }
    }
  }, [predictions, handleSelectPrediction]);

  /**
   * 컴포넌트 언마운트 시 타이머 정리
   */
  useEffect(() => {
    return () => {
      if (predictionsTimeoutRef.current) {
        clearTimeout(predictionsTimeoutRef.current);
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
      'establishment': '시설',
      'premise': '건물',
      'route': '도로',
      'political': '행정구역'
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }
    return '장소';
  };

  /**
   * 로딩 상태 확인
   * 자동완성 로딩과 장소 선택 로딩을 구분
   */
  const isLoading = isLoadingPredictions || isSelectingPlace;

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
              disabled={disabled || isSelectingPlace}
              error={!!error}
              helperText={error}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SearchIcon color="action" />
                    )}
                  </InputAdornment>
                ),
                endAdornment: inputValue && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setInputValue('');
                        setPredictions([]);
                        setIsOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* 자동완성 제안 드롭다운 */}
            <Popper
              open={isOpen && predictions.length > 0}
              anchorEl={anchorRef.current}
              placement="bottom-start"
              style={{ zIndex: 1300, width: anchorRef.current?.offsetWidth }}
            >
              <Paper elevation={8} sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {predictions.map((prediction) => (
                    <ListItem key={prediction.placeId} disablePadding>
                      <ListItemButton
                        onClick={() => handleSelectPrediction(prediction)}
                        sx={{ py: 1.5 }}
                        disabled={isSelectingPlace}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <LocationOnIcon color="action" />
                        </ListItemIcon>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {prediction.mainText}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                              {prediction.secondaryText}
                            </Typography>
                            {prediction.types.length > 0 && (
                              <Chip 
                                label={getPlaceTypeText(prediction.types)}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 18, flexShrink: 0 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Popper>
          </Box>
        </ClickAwayListener>
      )}
    </Box>
  );
};

export default PlaceSearchInput;