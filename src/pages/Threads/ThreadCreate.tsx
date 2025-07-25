import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createThread, uploadFile  } from '../../services/threadApi'; // 게시글 작성 API 호출 함수 및 파일 업로드 
import { AuthContext } from '../../context/AuthContext'; // 로그인 정보 context
import { Box, Button, TextField, Typography } from '@mui/material';

const ThreadCreate = () => {
  // 게시글 작성 폼 상태: 제목, 내용, PDF 경로, 여행 지역
  const [form, setForm] = useState({
    title: '',
    content: '',
    filePath: '',
    area: '',
  });
  const [files, setFiles] = useState<File[]>([]); // 여러 파일 배열 상태


  // 로그인한 사용자 정보 context에서 가져오기
  const { user } = useContext(AuthContext);

  // 페이지 이동 함수
  const navigate = useNavigate();

  // 폼 입력 변경 시 호출됨 (input, textarea 공통)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // 기존 상태를 복사한 뒤 변경된 항목만 업데이트
    setForm(prev => ({ ...prev, [name]: value }));
  };
    //파일 선택 이벤트 처리기 추가 파일 업로드
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setFiles(Array.from(e.target.files)); // 여러 개 파일 배열로 저장
      }
    };

  // 폼 제출 시 호출되는 함수 (게시글 작성 요청 처리)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!user) {
      alert('로그인 후 게시글을 작성할 수 있습니다.');
      return;
    }
  
    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
  
    try {
      const uploadedFilePaths: string[] = [];
  
      // 여러 파일 업로드 처리
      for (const file of files) {
        const path = await uploadFile(file);
        uploadedFilePaths.push(path);
      }
  
      // API 요청
      await createThread({
        userId: user.userId,
        author: user.username,
        title: form.title.trim(),
        content: form.content.trim(),
        filePaths: uploadedFilePaths, // 여러 파일 경로 배열 전달
        area: form.area.trim() || '',
      });
  
      navigate('/thread');
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    }
  };
  

  return (
    <Box
  sx={{
    maxWidth: 1140, // 💡 960 → 1140 으로 더 넓게 설정
    margin: '2rem auto',
    padding: '2.5rem',
    backgroundColor: 'white',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  }}
>
      <Typography variant="h4" sx={{ marginBottom: '1.5rem', color: '#1976d2', fontWeight: 'bold' }}>
        ✍️ 게시글 작성
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <TextField
          label="제목"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          fullWidth
        />

        <TextField
          label="내용"
          name="content"
          value={form.content}
          onChange={handleChange}
          required
          multiline
          rows={8}
          fullWidth
        />

        {/*  기존 pdfPath 텍스트필드 대신 파일 업로드 input 추가 파일 업로드*/}
        <input 
          type="file" 
          accept="application/pdf, image/*"
          multiple
          onChange={handleFileChange} 
          style={{ marginTop: '10px' }} 
        />
        {/* 파일 업로드 한 뒤 자동으로 filePath 상태에 반영됨 */}

        <TextField
          label="여행 지역 (선택)"
          name="area"
          value={form.area}
          onChange={handleChange}
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          sx={{
            backgroundColor: '#1976d2',
            padding: '0.75rem',
            borderRadius: '25px',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#1565c0',
              transform: 'translateY(-2px)',
            },
          }}
        >
          작성 완료
        </Button>
      </Box>
    </Box>
  );
};

export default ThreadCreate;
