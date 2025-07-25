import React from 'react';
import { LoadScript } from '@react-google-maps/api';
import { YOUR_GOOGLE_MAPS_API_KEY } from '../../../_env/env.local';
import { Box, CircularProgress, Alert } from '@mui/material';

/**
 * Google Maps API 로드에 필요한 라이브러리들
 */
const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = [
  'places' // Places API (검색, 자동완성)
];

/**
 * Google Maps API LoadScript Props
 */
interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

/**
 * Google Maps API 로더 컴포넌트
 * 
 * 역할:
 * 1. Google Maps JavaScript API를 안전하게 로드
 * 2. API 키 검증 및 에러 처리
 * 3. 로딩 상태 표시
 * 4. 필요한 라이브러리들 사전 로드
 */
const GoogleMapsLoader: React.FC<GoogleMapsLoaderProps> = ({ children }) => {
  // API 키 유효성 검사
  if (!YOUR_GOOGLE_MAPS_API_KEY || YOUR_GOOGLE_MAPS_API_KEY === 'your-api-key-here') {
    return (
      <Box 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <strong>Google Maps API 키가 설정되지 않았습니다.</strong>
          <br />
          env.local.ts 파일에서 YOUR_GOOGLE_MAPS_API_KEY를 확인해주세요.
        </Alert>
      </Box>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={YOUR_GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
      loadingElement={
        <Box 
          sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2
          }}
        >
          <CircularProgress size={40} />
          <Box sx={{ color: 'text.secondary' }}>
            Google Maps를 로드하고 있습니다...
          </Box>
        </Box>
      }
      onLoad={() => {
        console.log('Google Maps API 로드 완료');
      }}
      onError={(error) => {
        console.error('Google Maps API 로드 실패:', error);
      }}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsLoader;
