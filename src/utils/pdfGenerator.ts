import { TourType } from '../types/travel';


// 📋 PDF 설정 타입
export interface PDFConfig {
  fontSize: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  fonts: {
    regular: string;
    bold: string;
  };
}

// 🎨 PDF 스타일 옵션
export interface PDFStyleOptions {
  pageOrientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'LETTER';
  margin?: number;
  headerColor?: string;
  accentColor?: string;
}

// 📄 PDF 생성 결과
export interface PDFGenerationResult {
  success: boolean;
  fileName?: string;
  error?: string;
  fileSize?: number;
}

// 🔤 폰트 로딩 관련 타입
export interface FontConfig {
  name: string;
  path: string;
  family: string;
  weight: 'normal' | 'bold';
}

// 📊 PDF 메타데이터
export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  creationDate: Date;
}

// 🎯 기본 PDF 설정
export const DEFAULT_PDF_CONFIG: PDFConfig = {
  fontSize: {
    title: 20,
    subtitle: 14,
    body: 11,
    small: 9
  },
  colors: {
    primary: '#2980b9',
    secondary: '#f8f9fa',
    text: '#212529',
    background: '#ffffff'
  },
  fonts: {
    regular:  'Times-Roman',//'NotoSansKR',
    bold: 'Times-Bold'//'NotoSansKR'
  }
};

// 🔤 폰트 설정
export const FONT_CONFIGS: FontConfig[] = [
  // {
  //   name: 'NotoSansKR-Regular',
  //   path: '', //'/fonts/NotoSansKR-Regular.ttf',
  //   family: 'Malgun Gothic', //'NotoSansKR',
  //   weight: 'normal'
  // }
];

// 📁 파일명 생성 유틸리티
export const generatePDFFileName = (tourTitle: string, date?: string): string => {
  const sanitizedTitle = tourTitle.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim();
  const dateStr = date || new Date().toISOString().split('T')[0];
  return `${sanitizedTitle}_${dateStr}.pdf`;
};

// 📅 날짜 포맷 유틸리티
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  } catch {
    return dateString;
  }
};

// 💰 금액 포맷 유틸리티
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('ko-KR') + '원';
};

// 🎨 색상 유틸리티
export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0];
};

// 📏 텍스트 길이 제한 유틸리티
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// 🔍 데이터 검증 유틸리티
export const validateTourData = (tour: TourType): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!tour.title?.trim()) {
    errors.push('여행 제목이 없습니다.');
  }

  if (!tour.startDate) {
    errors.push('출발일이 설정되지 않았습니다.');
  }

  if (!tour.endDate) {
    errors.push('종료일이 설정되지 않았습니다.');
  }

  if (!tour.travelers || tour.travelers < 1) {
    errors.push('여행자 수가 올바르지 않습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 📱 브라우저 다운로드 유틸리티
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 메모리 정리
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// 🔧 오류 처리 유틸리티
export const handlePDFError = (error: unknown): PDFGenerationResult => {
  console.error('PDF 생성 오류:', error);
  
  let errorMessage = 'PDF 생성 중 알 수 없는 오류가 발생했습니다.';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  return {
    success: false,
    error: errorMessage
  };
};