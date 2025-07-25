import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthModal } from "./Modal";
import LogoutButton from "./LogoutButton";

import { AuthContext } from "../context/AuthContext"; 
import NotificationPopup from "../pages/Notifications/Notification";

export const Header: React.FC = () => {
  // 인증 정보 Context 가져오기
  const authContext = useContext(AuthContext); //AuthProvider → AuthContext 바꿈
  // 예외 처리: Context가 없을 경우
  if (!authContext) {
    throw new Error('Header must be used within an AuthProvider');
  }

  const { isAuthenticated, user} = authContext; // 로그인 상태
  // 로그인 & 회원가입 모달 상태 관리
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openSignupModal, setOpenSignupModal] = useState(false);
 // 로그인 모달 열기
  const handleOpenLoginModal = () => setOpenLoginModal(true);
  const handleCloseLoginModal = () => {
    setOpenLoginModal(false);
  };
// 회원가입 모달 열기 (로그인 모달 닫고)
  const handleOpenSignupModal = () => {
    setOpenLoginModal(false);
    setOpenSignupModal(true);
  };

  const handleCloseSignupModal = () => setOpenSignupModal(false);
 // 회원가입 모달에서 로그인으로 돌아가기
  const handleBackToLogin = () => {
    setOpenSignupModal(false);
    setOpenLoginModal(true);
  };

  return (
    <>
     {/*  상단 고정 Header 영역 */}
      <header
        style={{
          margin: "0",
          padding: "24px 40px 24px 48px",
          width: "100%",
          height: "80px",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        {/*  왼쪽 로고 or 제목 */}
        <div style={{ fontSize: "24px", fontWeight: "bold" }}>🌍 어디로든 문</div>
   {/* 🔹 네비게이션 메뉴 */}
        <nav style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#333", fontSize: "1.1rem", fontWeight: "500" }}>홈</Link>
          <Link to="/tours" style={{ textDecoration: "none", color: "#333", fontSize: "1.1rem", fontWeight: "500" }}>여행 계획</Link>
          <Link to="/tour-list" style={{ textDecoration: "none", color: "#333", fontSize: "1.1rem", fontWeight: "500" }}>나의 여행</Link>
          <Link to="/thread" style={{ textDecoration: "none", color: "#333", fontSize: "1.1rem", fontWeight: "500" }}>여행 게시판</Link>
          <Link to="/mypage" style={{ textDecoration: "none", color: "#333", fontSize: "1.1rem", fontWeight: "500" }}>마이페이지</Link>
          {/* 👇 관리자일 때만 보여줌 */}
          {user?.role === 'ADMIN' && (
            <Link to="/adminpage" style={{ textDecoration: "none", color: "#333", fontSize: "1.1rem", fontWeight: "500" }}>관리자 페이지</Link>
          )}
        </nav>
 {/*  로그인/로그아웃 버튼 영역 */}
        <div className="auth-buttons">
          {isAuthenticated ? ( // isAuthenticated로 접근
          <>
            <LogoutButton /> 
            <NotificationPopup /> {/*  로그인한 사용자에만 종 아이콘 표시 */}
            </>
          ) : (
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#1976D2",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                marginRight: "20px",
              }}
              onClick={handleOpenLoginModal}
            >
              로그인
            </button>
          )}
        </div>
      </header>
  {/*  로그인/회원가입 모달 */}
      <AuthModal
        openLogin={openLoginModal}
        openSignup={openSignupModal}
        onCloseLogin={handleCloseLoginModal}
        onCloseSignup={handleCloseSignupModal}
        onOpenSignup={handleOpenSignupModal}
        onBackToLogin={handleBackToLogin}
      />
    </>
  );
};