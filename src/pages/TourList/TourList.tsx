import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon,
  CalendarToday,
  People,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTravelStore, useTravelActions } from "../../store/travelStore";
import { TourType } from "../../types/travel";
import { tourAPI } from "../../services/tourApi";

const TourList: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useTravelStore();

  const {
    loadUserToursFromBackend,
    loadTourFromBackend,
    createNewTourInBackend,
    setLoading,
    setError,
  } = useTravelActions();

  // 로컬 상태
  const [tours, setTours] = useState<TourType[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    travelers: 2,
    budget: "medium" as "low" | "medium" | "high" | "luxury",
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTourId, setMenuTourId] = useState<number | null>(null);

  // 현재 사용자 정보
  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.userId;
      } catch (error) {
        console.error("사용자 정보 파싱 실패:", error);
      }
    }
    return null;
  };

  // 여행 목록 로드
  const loadTours = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      const userTours = await loadUserToursFromBackend(userId);
      setTours(userTours);
    } catch (error) {
      console.error("여행 목록 로드 실패:", error);
    }
  };

  // 컴포넌트 마운트 시 여행 목록 로드
  useEffect(() => {
    loadTours();
  }, []);

  // 새 여행 생성
  const handleCreateNewTour = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      await createNewTourInBackend(userId);
      navigate("/tours"); // 여행 계획 작성 페이지로 이동
    } catch (error) {
      console.error("새 여행 생성 실패:", error);
    }
  };

  // 여행 편집 다이얼로그 열기
  const handleEditClick = (tour: TourType) => {
    setSelectedTour(tour);
    setEditForm({
      title: tour.title,
      startDate: tour.startDate,
      endDate: tour.endDate,
      travelers: tour.travelers,
      budget: tour.budget,
    });
    setIsEditDialogOpen(true);
    handleMenuClose();
  };

  // 여행 정보 수정
  const handleEditSave = async () => {
    if (!selectedTour) return;

    try {
      setLoading(true);
      const updatedTour = await tourAPI.updateTour(
        selectedTour.tourId!,
        editForm
      );

      // 목록에서 업데이트
      setTours((prevTours) =>
        prevTours.map((tour) =>
          tour.tourId === selectedTour.tourId ? updatedTour : tour
        )
      );

      setIsEditDialogOpen(false);
      setSelectedTour(null);
    } catch (error) {
      console.error("여행 정보 수정 실패:", error);
      setError("여행 정보 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 여행 삭제
  const handleDeleteClick = (tour: TourType) => {
    setSelectedTour(tour);
    setIsDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTour) return;

    try {
      setLoading(true);
      await tourAPI.deleteTour(selectedTour.tourId!);

      // 목록에서 제거
      setTours((prevTours) =>
        prevTours.filter((tour) => tour.tourId !== selectedTour.tourId)
      );

      setIsDeleteDialogOpen(false);
      setSelectedTour(null);
    } catch (error) {
      console.error("여행 삭제 실패:", error);
      setError("여행 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 여행 복사
  const handleCopyClick = async (tour: TourType) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      setLoading(true);
      const copiedTour = await tourAPI.copyTour(tour.tourId!, userId);

      // 목록에 추가
      setTours((prevTours) => [copiedTour, ...prevTours]);

      handleMenuClose();
    } catch (error) {
      console.error("여행 복사 실패:", error);
      setError("여행 복사에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 여행 열기 (수정 모드)
  const handleOpenTour = async (tour: TourType) => {
    try {
      setLoading(true);
      await loadTourFromBackend(tour.tourId!);
      navigate("/tours"); // 여행 계획 작성 페이지로 이동
    } catch (error) {
      console.error("여행 로드 실패:", error);
      setError("여행을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 메뉴 핸들링
  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    tourId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuTourId(tourId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTourId(null);
  };

  // 예산 타입을 한국어로 변환
  const getBudgetLabel = (budget: string) => {
    const budgetMap = {
      low: "절약형",
      medium: "일반형",
      high: "럭셔리",
    };
    return budgetMap[budget as keyof typeof budgetMap] || budget;
  };

  // 여행 기간 계산
  const getTravelDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isLoading && tours.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      {/* 헤더 */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          color: "white",
          p: 5,
          borderRadius: 3,
          mb: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" fontWeight={700}>
          💬 나의 여행 계획
        </Typography>
        <Typography variant="h6" mt={1}>
        나만의 여행 계획을 관리해보세요
        </Typography>
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 여행 목록 */}
      {tours.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          textAlign="center"
        >
          <Typography variant="h6" color="text.secondary" mb={2}>
            아직 저장된 여행 계획이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            첫 번째 여행 계획을 만들어보세요!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNewTour}
            size="large"
          >
            새 여행 만들기
          </Button>
        </Box>
      ) : (
        <Grid container spacing={1}>
          {tours.map((tour) => (
            <Box 
            sx={{ 
              width: { xs: '100%', sm: '50%', lg: '32.74%' },
              padding: 1 
            }} 
            key={tour.tourId}
          >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  "&:hover": {
                    boxShadow: 4,
                    transform: "translateY(-2px)",
                    transition: "all 0.2s ease-in-out",
                  },
                }}
              >
                {/* 메뉴 버튼 */}
                <IconButton
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                    },
                  }}
                  onClick={(e) => handleMenuClick(e, tour.tourId!)}
                >
                  <MoreVertIcon />
                </IconButton>

                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  {/* 여행 제목 */}
                  <Typography
                    variant="h6"
                    component="h2"
                    gutterBottom
                    sx={{
                      fontWeight: "bold",
                      pr: 5, // 메뉴 버튼 공간 확보
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tour.title}
                  </Typography>

                  {/* 여행 정보 */}
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarToday
                        sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {tour.startDate} ~ {tour.endDate}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        {getTravelDays(tour.startDate, tour.endDate)}일 여행
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" mb={1}>
                      <People
                        sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {tour.travelers}명
                      </Typography>
                    </Box>
                  </Box>

                  {/* 예산 타입 칩 */}
                  <Chip
                    label={getBudgetLabel(tour.budget)}
                    size="small"
                    color={
                      tour.budget === "high"
                        ? "error"
                        : tour.budget === "medium"
                        ? "primary"
                        : "success"
                    }
                    sx={{ mb: 2 }}
                  />

                  {/* 생성/수정 날짜 */}
                  <Typography variant="caption" color="text.secondary">
                    {tour.modifiedDate
                      ? `수정: ${new Date(
                          tour.modifiedDate
                        ).toLocaleDateString()}`
                      : tour.createDate
                      ? `생성: ${new Date(
                          tour.createDate
                        ).toLocaleDateString()}`
                      : ""}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<LaunchIcon />}
                    onClick={() => handleOpenTour(tour)}
                  >
                    여행 열기
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Grid>
      )}

      {/* 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 },
        }}
      >
        <MenuItem
          onClick={() => {
            const tour = tours.find((t) => t.tourId === menuTourId);
            if (tour) handleEditClick(tour);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>수정</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            const tour = tours.find((t) => t.tourId === menuTourId);
            if (tour) handleCopyClick(tour);
          }}
        >
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>복사</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            const tour = tours.find((t) => t.tourId === menuTourId);
            if (tour) handleDeleteClick(tour);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>삭제</ListItemText>
        </MenuItem>
      </Menu>

      {/* 편집 다이얼로그 */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>여행 정보 수정</DialogTitle>
        <DialogContent>
          <TextField
            label="여행 제목"
            fullWidth
            margin="normal"
            value={editForm.title}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          <TextField
            label="시작 날짜"
            type="date"
            fullWidth
            margin="normal"
            value={editForm.startDate}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, startDate: e.target.value }))
            }
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="종료 날짜"
            type="date"
            fullWidth
            margin="normal"
            value={editForm.endDate}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, endDate: e.target.value }))
            }
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="여행자 수"
            type="number"
            fullWidth
            margin="normal"
            value={editForm.travelers}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                travelers: parseInt(e.target.value) || 1,
              }))
            }
            inputProps={{ min: 1, max: 20 }}
          />

          <TextField
            label="예산 타입"
            select
            fullWidth
            margin="normal"
            value={editForm.budget}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                budget: e.target.value as "low" | "medium" | "high" | "luxury",
              }))
            }
          >
            <MenuItem value="low">절약형</MenuItem>
            <MenuItem value="medium">일반형</MenuItem>
            <MenuItem value="high">럭셔리</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={!editForm.title.trim()}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>여행 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            '{selectedTour?.title}' 여행을 정말 삭제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            삭제된 여행은 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
};

export default TourList;
