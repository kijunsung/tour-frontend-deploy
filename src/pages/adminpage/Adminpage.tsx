import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState, useEffect } from "react";
import api from "../../services/api";  // ✅ api 인스턴스 사용
import { User } from "../../types/user";  // User 타입에 userId, name, email, role, createDate 필드가 있어야 합니다

export default function Adminpage() {
  // ── 상태 관리 ─────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);            // 유저 리스트
  const [keyword, setKeyword] = useState("");               // 검색어
  const [searchType, setSearchType] =          // 검색 기준: name 또는 email
    useState<"name" | "email">("name");
  const [sortBy, setSortBy] =                        // 정렬 기준: 가입일순 또는 권한순
    useState<"createDate" | "role">("createDate");
  const [userCount, setUserCount] = useState(0);    // 통계: 사용자 수
  const [threadCount, setThreadCount] = useState(0);// 통계: 게시글 수
  const [reportCount, setReportCount] = useState(0);// 통계: 신고 수

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;
  const totalPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // 삭제 확인 모달용 상태
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // ── 마운트 시: 통계 + 전체 유저 로드 ───────────────────────────────────
  useEffect(() => {
    // 1) 통계 API 호출
    api.get("/admin/statistics")  // ✅ api 인스턴스 사용
      .then(res => {
        setUserCount(res.data.userCount);
        setThreadCount(res.data.threadCount);
        setReportCount(res.data.reportCount);
      })
      .catch(console.error);

    // 2) 전체 유저 조회 (초기에는 빈 키워드)
    api.get("/admin/users", {  // ✅ api 인스턴스 사용
      params: { searchType, keyword: "", sortBy }
    })
      .then(res => {
        setUsers(res.data);
        setCurrentPage(1);
      })
      .catch(console.error);
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번 실행

  // ── 검색 처리 ─────────────────────────────────────────────────────────
  const handleSearch = () => {
    api.get("/admin/users", {  // ✅ api 인스턴스 사용
      params: { searchType, keyword, sortBy }
    })
      .then(res => {
        setUsers(res.data);
        setCurrentPage(1);
      })
      .catch(console.error);
  };

  // ── 삭제 모달 열기/닫기 & 최종 삭제 ───────────────────────────────────
  const handleOpenDialog = (userId: number) => {
    setSelectedUserId(userId);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUserId(null);
  };
  const handleConfirmDelete = () => {
    console.log(selectedUserId);
    if (selectedUserId !== null) {
      api.delete(`/admin/users/${selectedUserId}`) // ✅ 올바른 엔드포인트 + api 인스턴스
        .then(res => {
          alert(res.data.message || "사용자 삭제 완료");
          setUsers(prev => prev.filter(u => u.userId !== selectedUserId));
        })
        .catch(err => {
          alert(err.response?.data.message || "삭제 실패");
        })
        .finally(() => handleCloseDialog());
    }
  };

  return (
    <Box sx={{ width: 1000, mx: "auto", p: 4 }}>
      {/* ── 헤더 ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          color: "white",
          p: 5,
          borderRadius: 3,
          mb: 4,
          textAlign: "center"
        }}
      >
        <Typography variant="h3" fontWeight={700}>
          💬 관리자 대시보드
        </Typography>
        <Typography variant="h6" mt={1}>
          시스템 현황을 모니터링하고 사용자를 관리하세요
        </Typography>
      </Box>

      {/* ── 검색 & 필터 ─────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          {/* 정렬 기준 선택 */}
          <FormControl size="medium" sx={{ minWidth: 150 }}>
            <InputLabel>정렬</InputLabel>
            <Select
              value={sortBy}
              label="정렬"
              onChange={e => setSortBy(e.target.value as any)}
            >
              <MenuItem value="createDate">가입일 순</MenuItem>
              <MenuItem value="role">권한 순</MenuItem>
            </Select>
          </FormControl>

          {/* 검색 기준 선택 */}
          <FormControl size="medium" sx={{ minWidth: 180 }}>
            <InputLabel>검색 기준</InputLabel>
            <Select
              value={searchType}
              label="검색 기준"
              onChange={e => setSearchType(e.target.value as any)}
            >
              <MenuItem value="name">사용자명</MenuItem>
              <MenuItem value="email">이메일</MenuItem>
            </Select>
          </FormControl>

          {/* 검색어 입력 */}
          <TextField
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="검색어를 입력하세요"
            size="medium"
            sx={{ minWidth: 300 }}
          />

          {/* 검색 버튼 */}
          <Button variant="contained" size="large" onClick={handleSearch}>
            🔍 검색
          </Button>
        </Stack>
      </Paper>

      {/* ── 사용자 테이블 ───────────────────────────────────────────────── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>번호</TableCell>
              <TableCell>사용자명</TableCell>
              <TableCell>이메일</TableCell>
              <TableCell>권한</TableCell>
              <TableCell>가입일</TableCell>
              <TableCell align="center">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((u, idx) => (
              <TableRow key={`${u.userId}-${idx}`}>
                <TableCell>
                  {(currentPage - 1) * usersPerPage + idx + 1}
                </TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.createDate}</TableCell>
                <TableCell align="center">
                  {/* 삭제 아이콘 클릭 시 모달 열기 */}
                  <IconButton
                  color="error"
                  onClick={() => handleOpenDialog(u.userId)}
                  disabled={u.role === "ADMIN"}> 
                  <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── 페이지네이션 ─────────────────────────────────────────────────── */}
      <Stack alignItems="center" mt={2}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(_, p) => setCurrentPage(p)}
          color="primary"
        />
      </Stack>

      {/* ── 통계 카드 ───────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={2} justifyContent="space-between" mt={3}>
        <Paper elevation={3} sx={{ flex: 1, p: 3, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6">사용자 수</Typography>
          <Typography variant="h4" color="primary">{userCount}</Typography>
        </Paper>
        <Paper elevation={3} sx={{ flex: 1, p: 3, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6">게시글 수</Typography>
          <Typography variant="h4" color="primary">{threadCount}</Typography>
        </Paper>
        <Paper elevation={3} sx={{ flex: 1, p: 3, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6">신고 수</Typography>
          <Typography variant="h4" color="primary">{reportCount}</Typography>
        </Paper>
      </Stack>

      {/* ── 삭제 확인 모달 ───────────────────────────────────────────────── */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>삭제하시겠습니까?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            선택한 사용자를 영구적으로 삭제합니다. 계속하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={handleConfirmDelete}>
            삭제
          </Button>
          <Button onClick={handleCloseDialog}>취소</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
