export const formatDuration = (duration: string): string => {
  const seconds = parseInt(duration.replace('s', ''));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  }
  return `${minutes}분`;
};

export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
};

export const durationToTime = (duration: string): string => {
  const seconds = parseInt(duration.replace('s', ''));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getVehicleDisplayName = (travelMode: string, transitDetails?: any): string => {
  if (travelMode === 'TRANSIT' && transitDetails) {
    return transitDetails.transitLine?.vehicle?.name?.text || '대중교통';
  }
  
  switch (travelMode) {
    case 'WALKING':
      return '도보';
    case 'TRANSIT':
      return '대중교통';
    default:
      return travelMode;
  }
};