import { Header } from "./components/Header";
import Footer from "./components/Footer";
import AuthProvider from "./context/AuthProvider";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { HashRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/mainpage/mainpage";
import Tour from "./pages/Tours/Tours";
import TourList from "./pages/TourList/TourList";
// import Traffic from "./pages/Traffic/Traffic";
import ThreadList from './pages/Threads/ThreadList';
import ThreadCreate from './pages/Threads/ThreadCreate';
import ThreadDetail from './pages/Threads/ThreadDetail';
import MyPage from "./pages/Mypage/Mypage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Adminpage from "./pages/adminpage/Adminpage";

// Material-UI 테마 생성
const theme = createTheme({
  palette: {
    mode: 'light',
  },
  components: {
    // Grid 컴포넌트에 대한 기본 설정
    MuiGrid: {
      styleOverrides: {
        root: {
          width: '100%',
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          margin: "0",
          padding: "0",
          width: "100%",
          minHeight: "100vh",
          height: "auto",
          position: "relative",
          overflow: "auto",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <Router>
              <AuthProvider>
              <Header />
              
              {/* 메인 컨텐츠 영역 - 남은 공간을 모두 차지 */}
              <main style={{ 
                flex: "1 0 auto", // flex-grow: 1, flex-shrink: 0, flex-basis: auto
                display: "flex",
                flexDirection: "column"
              }}>
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/tours" element={
                    <ProtectedRoute>
                      <Tour />
                    </ProtectedRoute>
                  } />
                  <Route path="/tour-list" element={
                    <ProtectedRoute>
                      <TourList />
                    </ProtectedRoute>
                  } />
                  <Route path="/plan" element={
                    <ProtectedRoute>
                      <Tour />
                    </ProtectedRoute>
                  } />
                  <Route
                    path="/thread"
                    element={
                      <ProtectedRoute>
                        <ThreadList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/thread/create"
                    element={
                      <ProtectedRoute>
                        <ThreadCreate />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/thread/:threadId"
                    element={
                      <ProtectedRoute>
                        <ThreadDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/mypage" element={
                    <ProtectedRoute>
                      <MyPage />
                    </ProtectedRoute>
                  } />
                    <Route
                    path="/adminpage"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <Adminpage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              {/* Footer - 항상 하단에 위치 */}
              <Footer />
              </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );
}