import { useEffect, useState, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  getUserProfile,
  updateUserProfile,
  getUserIdByUsername,
} from "../../services/userApi";
import { UserResponse, UserUpdateRequest } from "../../types/user";
import { AuthContext } from "../../context/AuthContext";
import { getLikedThreads } from "../../services/userApi";
import { Thread } from "../../types/thread";
import { useNavigate } from "react-router-dom";
import { getUserThreads } from '../../services/threadApi';

const Mypage = () => {
  const { token } = useContext(AuthContext);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 좋아요 누른 게시글 리스트 뽑아오기
  const [likedThreads, setLikedThreads] = useState<Thread[]>([]);
  const [likedLoading, setLikedLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      setLikedLoading(true);
      getLikedThreads(user.userId)
        .then(setLikedThreads)
        .catch(() => setLikedThreads([]))
        .finally(() => setLikedLoading(false));
    }
  }, [user]);

  const [form, setForm] = useState<UserUpdateRequest>({
    username: "",
    name: "",
    email: "",
    phone: "",
    nickname: "",
    password: "",
  });

  // 마이페이지 나의 게시글 열람
  const [myThreads, setMyThreads] = useState<Thread[]>([]);
  const [myLoading, setMyLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setMyLoading(true);
      getUserThreads(user.userId)
        .then(setMyThreads)
        .catch(() => setMyThreads([]))
        .finally(() => setMyLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const username = payload.sub;

      if (!username) {
        setError("유효하지 않은 사용자입니다.");
        setLoading(false);
        return;
      }

      getUserIdByUsername(username)
        .then((userId) => getUserProfile(userId))
        .then((data) => {
          setUser(data);
          setForm(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("사용자 정보를 불러오는데 실패했습니다.");
          setLoading(false);
        });
    } catch (err) {
      console.error(err);
      setError("토큰 파싱 오류");
      setLoading(false);
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!token || !user) return;

    try {
      const updatedUser = await updateUserProfile(user.userId, form);
      setUser(updatedUser);
      setIsEditing(false);
      alert("정보가 성공적으로 수정되었습니다!");
    } catch (err) {
      console.error(err);
      alert("수정 실패");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ textAlign: "center", mt: 4 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: "700px",
        width: "100%",
        mx: "auto",
        mt: 5,
        p: 3,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "white",
          boxShadow: 3,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
          color="primary"
          gutterBottom
          sx={{ mb: 2, textAlign: "center" }}
        >
          마이페이지
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {user && !isEditing && (
          <Stack spacing={2}>
            <Typography>
              <strong>User Name:</strong> {user.username}
            </Typography>
            <Typography>
              <strong>이름:</strong> {user.name}
            </Typography>
            <Typography>
              <strong>닉네임:</strong> {user.nickname}
            </Typography>
            <Typography>
              <strong>이메일:</strong> {user.email}
            </Typography>
            <Typography>
              <strong>폰번호:</strong> {user.phone}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsEditing(true)}
              sx={{ mt: 2, borderRadius: 8, px: 3 }}
            >
              ✏️ 회원정보 수정
            </Button>
          </Stack>
        )}

        {user && isEditing && (
          <Box component="form" noValidate autoComplete="off">
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.secondary">
                User Name: {user.username}
              </Typography>
              <TextField
                label="이름"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                size="medium"
              />
              <TextField
                label="닉네임"
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
                fullWidth
                size="medium"
              />
              <TextField
                label="이메일"
                name="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                size="medium"
                type="email"
              />
              <TextField
                label="연락처"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
                size="medium"
              />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  sx={{ borderRadius: 8, px: 4 }}
                >
                  ✅ 저장
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsEditing(false)}
                  sx={{ borderRadius: 8, px: 4 }}
                >
                  ❌ 취소
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </Paper>
      <Divider sx={{ my: 4 }} />
      <Typography variant="h5" fontWeight={600} gutterBottom>
        나의 게시글
      </Typography>
      {myLoading ? (
        <CircularProgress />
      ) : myThreads.length === 0 ? (
        <Typography color="text.secondary">
          아직 작성한 게시글이 없습니다.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {myThreads.map((thread) => (
            <Paper
              key={thread.threadId}
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: 1,
                cursor: "pointer",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 6 },
              }}
              onClick={() => navigate(`/thread/${thread.threadId}`)}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {thread.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {thread.author} | {thread.createDate?.substring(0, 10)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                {thread.content?.slice(0, 60) || ""}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h5" fontWeight={600} gutterBottom>
        내가 좋아요 누른 게시글
      </Typography>

      {likedLoading ? (
        <CircularProgress />
      ) : likedThreads.length === 0 ? (
        <Typography color="text.secondary">
          아직 좋아요 누른 게시글이 없습니다.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {likedThreads.map((thread) => (
            <Paper
              key={thread.threadId}
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: 1,
                cursor: "pointer", // 마우스 올리면 손가락
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 6 }, // 호버시 더 진하게
              }}
              onClick={() => navigate(`/thread/${thread.threadId}`)} // 상세페이지로 이동!
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {thread.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {thread.author} | {thread.createDate?.substring(0, 10)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                {thread.content?.slice(0, 60) || ""}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default Mypage;
