import React from 'react';
import { TourType } from '../types/travel'; // 타입 경로 조정하세요
import { generateTourPdf } from '../pages/Tours/TourPDF'; 

interface PDFDownloadButtonProps {
  tour: TourType;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ tour }) => {
  const handleDownload = async () => {
    try {
      await generateTourPdf(tour);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: '8px 16px',
        backgroundColor: '#0070f3',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
      }}
      aria-label="여행 계획 PDF 다운로드"
      type="button"
    >
      여행 계획 PDF 다운로드
    </button>
  );
};

export default PDFDownloadButton;
