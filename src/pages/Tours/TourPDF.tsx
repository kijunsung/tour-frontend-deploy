import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TourType, ScheduleItemDto } from '../../types/travel';
import {
  generatePDFFileName,
  formatDate,
  formatCurrency,
  validateTourData,
  PDFGenerationResult,
  handlePDFError
} from '../../utils/pdfGenerator';

// 🎯 PDF용 HTML 문서 생성
const createPDFHTML = (tour: TourType, filterDate?: string): string => {
  const { schedules = [], weatherData = [], metadata } = tour.planData || {};

  // 날짜 필터링 및 그룹화
  let filteredSchedules = schedules;
  if (filterDate) {
    filteredSchedules = schedules.filter(schedule => schedule.date === filterDate);
  }

  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const date = schedule.date || '날짜 미정';
    if (!acc[date]) acc[date] = [];
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItemDto[]>);

  const pageTitle = filterDate ? `${tour.title} - ${filterDate}` : tour.title;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
          line-height: 1.4;
          color: #333;
          background: white;
          padding: 15px;
          width: 794px; /* A4 너비 */
          font-size: 12px;
        }

        .header {
          background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
          color: white;
          padding: 16px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .header h1 {
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 6px;
        }

        .header p {
          font-size: 14px;
          opacity: 0.9;
        }

        .section {
          background: #f8f9fa;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #2980b9;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #2980b9;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .info-item {
          display: flex;
          align-items: center;
        }

        .info-label {
          font-weight: bold;
          min-width: 100px;
          color: #555;
        }

        .info-value {
          color: #333;
        }

        .date-header {
          font-size: 14px;
          font-weight: bold;
          color: #2980b9;
          background: #e3f2fd;
          padding: 8px;
          margin-bottom: 8px;
          border-radius: 6px;
          page-break-after: avoid;
        }

        .schedule-item {
          background: white;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 6px;
          border: 1px solid #ddd;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          page-break-inside: avoid;
        }

        .schedule-header {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #eee;
        }

        .time-chip {
          background: #fff3cd;
          color: #856404;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          margin-right: 8px;
          min-width: 80px;
          text-align: center;
        }

        .schedule-title {
          font-weight: bold;
          font-size: 12px;
          flex: 1;
        }

        .schedule-content {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
          line-height: 1.3;
        }

        .schedule-detail {
          font-size: 10px;
          color: #28a745;
          margin-top: 4px;
          font-style: italic;
        }

        .weather-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .weather-item {
          background: #fff8e1;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #ffecb3;
          text-align: center;
        }

        .weather-date {
          font-size: 12px;
          font-weight: bold;
          color: #ef6c00;
          margin-bottom: 6px;
        }

        .weather-temp {
          font-size: 16px;
          font-weight: bold;
          color: #d84315;
          margin-bottom: 4px;
        }

        .weather-desc {
          font-size: 11px;
          color: #5d4037;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
        }

        .meta-label {
          font-weight: bold;
          min-width: 80px;
          font-size: 12px;
          color: #666;
        }

        .meta-value {
          font-size: 12px;
          color: #333;
        }

        .footer {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 8px;
        }

        .empty-state {
          text-align: center;
          color: #999;
          font-style: italic;
          padding: 40px;
        }
      </style>
    </head>
    <body>
      <!-- 헤더 -->
      <div class="header">
        <h1>✈️ ${pageTitle}</h1>
        <p>${filterDate ? '일일 여행 계획서' : '완벽한 여행을 위한 스마트한 계획서'}</p>
      </div>

      <!-- 기본 정보 -->
      <div class="section">
        <div class="section-title">📋 여행 기본 정보</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">📅 출발일:</span>
            <span class="info-value">${formatDate(tour.startDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📅 종료일:</span>
            <span class="info-value">${formatDate(tour.endDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">👥 여행인원:</span>
            <span class="info-value">${tour.travelers}명</span>
          </div>
          <div class="info-item">
            <span class="info-label">💰 예산수준:</span>
            <span class="info-value">${tour.budget}</span>
          </div>
        </div>
      </div>

      <!-- 일정 정보 -->
      <div class="section">
        <div class="section-title">🗓️ ${filterDate ? `${filterDate} 일정` : '상세 여행 일정'}</div>
        ${Object.keys(groupedSchedules).length > 0 ? 
          Object.entries(groupedSchedules).map(([date, daySchedules]) => `
            <div>
              ${!filterDate ? `<div class="date-header">📅 ${formatDate(date)}</div>` : ''}
              ${daySchedules.map(schedule => `
                <div class="schedule-item">
                  <div class="schedule-header">
                    <span class="time-chip">
                      ${schedule.startTime}${schedule.endTime ? ` ~ ${schedule.endTime}` : ''}
                    </span>
                    <span class="schedule-title">${schedule.title}</span>
                  </div>
                  ${schedule.content ? `<div class="schedule-content">${schedule.content}</div>` : ''}
                  ${schedule.memo ? `<div class="schedule-memo">📝 메모: ${schedule.memo}</div>` : ''}
                  ${schedule.locationData ? `
                    <div class="schedule-detail">
                      📍 ${schedule.locationData.address}${schedule.locationData.rating ? ` | ⭐ ${schedule.locationData.rating}점` : ''}
                    </div>
                  ` : ''}
                  ${schedule.trafficData ? `
                    <div class="schedule-detail">
                      🚗 ${schedule.trafficData.mode}${schedule.trafficData.totalDuration ? ` | ⏱️ ${schedule.trafficData.totalDuration}` : ''}${schedule.trafficData.transfers && schedule.trafficData.transfers > 0 ? ` | 🔄 환승 ${schedule.trafficData.transfers}회` : ''}${schedule.trafficData.price && schedule.trafficData.price > 0 ? ` | 💰 ${formatCurrency(schedule.trafficData.price)}` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `).join('') 
          : `<div class="empty-state">${filterDate ? `${filterDate}에 등록된 일정이 없습니다.` : '아직 등록된 일정이 없습니다.'}</div>`
        }
      </div>

      <!-- 날씨 정보 -->
      ${weatherData.length > 0 ? `
        <div class="section">
          <div class="section-title">🌤️ 날씨 정보</div>
          <div class="weather-grid">
            ${weatherData
              .filter(weather => !filterDate || weather.date === filterDate)
              .map(weather => `
                <div class="weather-item">
                  <div class="weather-date">${weather.date}</div>
                  <div class="weather-temp">${weather.temperature}°C</div>
                  <div class="weather-desc">${weather.description}</div>
                </div>
              `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 메타데이터 -->
      ${metadata && !filterDate ? `
        <div class="section">
          <div class="section-title">📊 계획 정보</div>
          <div class="meta-grid">
            ${metadata.version ? `
              <div class="meta-item">
                <span class="meta-label">📋 버전:</span>
                <span class="meta-value">${metadata.version}</span>
              </div>
            ` : ''}
            ${metadata.totalDays !== undefined ? `
              <div class="meta-item">
                <span class="meta-label">📅 총 일수:</span>
                <span class="meta-value">${metadata.totalDays}일</span>
              </div>
            ` : ''}
            ${metadata.estimatedBudget !== undefined ? `
              <div class="meta-item">
                <span class="meta-label">💰 예상 예산:</span>
                <span class="meta-value">${formatCurrency(metadata.estimatedBudget)}</span>
              </div>
            ` : ''}
            ${metadata.lastUpdated ? `
              <div class="meta-item">
                <span class="meta-label">🕒 수정일:</span>
                <span class="meta-value">${formatDate(metadata.lastUpdated)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div class="footer">
        <span>📄 PDF 생성: ${new Date().toLocaleString('ko-KR')}</span>
        <span>⚡ Powered by jsPDF + html2canvas</span>
      </div>
    </body>
    </html>
  `;
};

// 🎯 메인 PDF 생성 함수
export const generateTourPdf = async (
  tour: TourType,
  options: { filterDate?: string } = {}
): Promise<PDFGenerationResult> => {
  try {
    console.log('🚀 PDF 생성 시작:', tour.title, options.filterDate ? `(${options.filterDate})` : '');

    // 데이터 검증
    const validation = validateTourData(tour);
    if (!validation.isValid) {
      throw new Error(`데이터 오류: ${validation.errors.join(', ')}`);
    }

    // HTML 생성
    const htmlContent = createPDFHTML(tour, options.filterDate);

    // 임시 DOM 요소 생성
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    // html2canvas로 이미지 생성
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // 고해상도
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight // 동적 높이
    });

    // DOM 정리
    document.body.removeChild(tempDiv);

    // 캔버스 크기
    const imgWidth = 794;
    const imgHeight = canvas.height * (imgWidth / canvas.width);
    const pageHeight = 1123; // A4 높이

    // jsPDF로 PDF 생성
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [794, 1123] // A4 크기
    });

    // 페이지 분할 처리
    if (imgHeight <= pageHeight) {
      // 한 페이지에 들어가는 경우
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // 여러 페이지로 분할
      const imgData = canvas.toDataURL('image/png');
      let heightLeft = imgHeight;
      let position = 0;

      // 첫 페이지
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 추가 페이지들
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    // 파일명 생성 및 다운로드
    const fileName = generatePDFFileName(tour.title, options.filterDate);
    pdf.save(fileName);

    console.log('✅ PDF 생성 완료:', fileName);

    return {
      success: true,
      fileName,
      fileSize: pdf.output('blob').size
    };

  } catch (error) {
    return handlePDFError(error);
  }
};

// 🎁 편의 함수들
export const generateFullTourPdf = (tour: TourType) => 
  generateTourPdf(tour);

export const generateDayTourPdf = (tour: TourType, date: string) => 
  generateTourPdf(tour, { filterDate: date });

// 🔤 폰트 등록 함수 (호환성 유지)
export const registerFonts = async (): Promise<boolean> => {
  console.log('✅ jsPDF + html2canvas 사용 - 별도 폰트 등록 불필요');
  return true;
};