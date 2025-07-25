  // 스타일 적용된 ThreadList.tsx - TravelPlan 게시판 UI 기반 (확장된 크기 버전)
  import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    SelectChangeEvent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
  } from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import { getThreads, searchThreads } from '../../services/threadApi';  // 게시글 목록을 가져오는 API 함수
import { Thread } from '../../types/thread';
import { AuthContext } from '../../context/AuthContext'; // 로그인 정보 받아오기 위함
import { useNavigate } from 'react-router-dom';
// MUI에서 공식 문서에 나오는 Pagination 컴포넌트 가져오기

function applySort(threads: Thread[], sortBy: 'createDate' | 'views' | 'likes') {
  const  sorted = threads.slice();
  if (sortBy === 'createDate') {
    sorted.sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime());
  } else if (sortBy === 'views') {
    sorted.sort((a, b) => b.count - a.count);
  } else if (sortBy === 'likes') {
    sorted.sort((a, b) => b.heart - a.heart);
  }
  return sorted;
}

const ThreadList = () => {
  // 전체 게시글 목록을 담는 상태, 초기값은 빈 배열
  const [threads, setThreads] = useState<Thread[]>([]);
  //검색 키워드 입력 상태
  const [keyword, setKeyword] = useState('');
  // 검색 기준 ('author' 또는 'title_content')
  const [searchType, setSearchType] = useState<'author' | 'title_content'>('title_content'); 
  // 정렬 기준
  const [sortBy, setSortBy] = useState<'createDate' | 'views' | 'likes'>('createDate');
  


  // 현재 페이지 번호 상태 저장 (초기값: 1페이지)
  const [currentPage, setCurrentPage] = useState(1);
   // 한 페이지당 게시글 개수
  const threadsPerPage = 20;

  // 로그인한 사용자 정보(context에서 가져옴)
  const { user } = useContext(AuthContext);

  // 페이지 이동 기능을 위한 useNavigate 훅
  const navigate = useNavigate();

  // 컴포넌트가 처음 렌더링 될 때 게시글 목록을 서버에서 가져오는 함수 실행
  useEffect(() => {
    getThreads()
      .then(setThreads)  // API 성공 시 받은 게시글 배열로 상태 업데이트
      .catch(err => {
        console.error('게시글 목록 불러오기 실패:', err);
      });
  }, []);

    //  검색 버튼 클릭 시 검색 API 호출
    const handleSearch = async () => {
      if (keyword.trim() === '') {
        // 검색어 비었으면 전체 글 다시 가져옴
        const all = await getThreads();
        setThreads(all);
        return;
      }
      try {
        const result = await searchThreads(keyword, searchType, sortBy);
        setThreads(result);
        setCurrentPage(1); // 검색 결과는 첫 페이지부터 보기
      } catch (err) {
        console.error('검색 실패:', err);
        alert('검색 중 오류 발생');
      }
    };

  // 전체 페이지 수 계산 (총 글 수 ÷ 페이지당 글 수)
  const totalPages = Math.ceil(threads.length / threadsPerPage);

  // 전체 글을 정렬 기준에 맞게 정렬
const sortedThreads = applySort(threads, sortBy);


  // 현재 페이지에서 보여줄 게시글만 잘라내기
  const startIdx = (currentPage - 1) * threadsPerPage;
  const endIdx = startIdx + threadsPerPage;
  const currentThreads = sortedThreads.slice(startIdx, endIdx);

  // 게시글 제목을 클릭하면 해당 게시글 상세 페이지로 이동하는 함수
  const handleTitleClick = (threadId: number) => {
    navigate(`/thread/${threadId}`);
  };

  // '새 게시글 작성' 버튼 클릭 시 실행 (로그인 여부 확인 후 작성 페이지로 이동)
  const handleCreateClick = () => {
    if (!user) {
      alert('로그인 후 게시글을 작성할 수 있습니다.');
      return;
    }
    navigate('/thread/create');
  };

    // 페이지 번호 클릭 시 실행되는 함수
    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
      setCurrentPage(value); // 현재 페이지 상태를 바꿔줌
    };

    return (
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 4 }}>
        {/* 헤더 배너 */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            p: 5,
            borderRadius: 3,
            mb: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={700}>💬 여행 공유</Typography>
          <Typography variant="h6" mt={1}>여행 경험을 공유하고 다른 여행자들과 소통해보세요</Typography>
        </Box>

        {/* 필터 & 검색 */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            <FormControl size="medium" sx={{ minWidth: 150 }}>
              <InputLabel>정렬</InputLabel>
              <Select
                value={sortBy}
                label="정렬"
                onChange={(e: SelectChangeEvent<'createDate' | 'views' | 'likes'>) =>
                  setSortBy(e.target.value as 'createDate' | 'views' | 'likes')
                }
              >
                <MenuItem value="createDate">최신순</MenuItem>
                <MenuItem value="views">조회수</MenuItem>
                <MenuItem value="likes">좋아요수</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="medium" sx={{ minWidth: 180 }}>
              <InputLabel>검색 기준</InputLabel>
              <Select
                value={searchType}
                label="검색 기준"
                onChange={(e: SelectChangeEvent<'author' | 'title_content'>) =>
                  setSearchType(e.target.value as 'author' | 'title_content')
                }
              >
                <MenuItem value="title_content">제목 + 내용</MenuItem>
                <MenuItem value="author">작성자</MenuItem>
              </Select>
            </FormControl>

            <TextField
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어를 입력하세요"
              size="medium"
              sx={{ minWidth: 300 }}
            />

            <Button variant="contained" color="primary" size="large" onClick={handleSearch}>
              🔍 검색
            </Button>
          </Stack>
        </Paper>

        {/* 글쓰기 버튼 */}
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateClick}
            sx={{ borderRadius: 999 }}
          >
            ✏️ 글쓰기
          </Button>
        </Box>

        {/* 게시글 테이블 */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
              <TableRow>
                <TableCell align="center" sx={{ fontSize: '1rem' }}>번호</TableCell>
                <TableCell align="left" sx={{ fontSize: '1rem' }}>제목</TableCell>
                <TableCell align="center" sx={{ fontSize: '1rem' }}>작성자</TableCell>
                <TableCell align="center" sx={{ fontSize: '1rem' }}>작성일</TableCell>
                <TableCell align="center" sx={{ fontSize: '1rem' }}>조회</TableCell>
                <TableCell align="center" sx={{ fontSize: '1rem' }}>좋아요</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentThreads.map((thread) => (
                <TableRow key={thread.threadId} hover>
                  <TableCell align="center">{thread.threadId}</TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: '#1976d2' },
                      fontWeight: 500,
                      fontSize: '1rem'
                    }}
                    onClick={() => handleTitleClick(thread.threadId)}
                  >
                    {thread.title}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.95rem' }}>{thread.author}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.95rem' }}>
                    {new Date(thread.createDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#1976d2', fontWeight: 500 }}>{thread.count}</TableCell>
                  <TableCell align="center" sx={{ color: '#f44336', fontWeight: 500 }}>{thread.heart}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        <Stack spacing={2} alignItems="center" mt={5}>
          <Pagination
            count={Math.min(totalPages, 10)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="large"
          />
        </Stack>
      </Box>
    );
  };



export default ThreadList;
