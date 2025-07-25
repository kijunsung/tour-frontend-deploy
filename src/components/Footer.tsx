export default function Footer() {
  
  return (
    <footer
      style={{
        margin: 0,
        padding: "40px 0 40px 0",
        width: "100%",
        backgroundColor: "rgb(51, 51, 51)",
        color: "rgb(255, 255, 255)",
        flexShrink: 0,
    }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          maxWidth: "1200px",
          margin: "0 auto",
          gap: "32px",
          flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: 0, marginBottom: "16px", fontSize: "18px" }}>서비스</h3>
          <a href="#planner" style={{ color: "#ccc", textDecoration: "none" }}>여행 계획</a>
          <a href="#thread" style={{ color: "#ccc", textDecoration: "none" }}>게시판</a>
          <a href="#guide" style={{ color: "#ccc", textDecoration: "none" }}>이용 가이드</a>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: 0, marginBottom: "16px", fontSize: "18px" }}>고객지원</h3>
          <a href="#faq" style={{ color: "#ccc", textDecoration: "none" }}>자주 묻는 질문</a>
          <a href="#contact" style={{ color: "#ccc", textDecoration: "none" }}>문의하기</a>
          <a href="#notice" style={{ color: "#ccc", textDecoration: "none" }}>공지사항</a>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: 0, marginBottom: "16px", fontSize: "18px" }}>회사 정보</h3>
          <a href="#about" style={{ color: "#ccc", textDecoration: "none" }}>회사 소개</a>
          <a href="#terms" style={{ color: "#ccc", textDecoration: "none" }}>약관</a>
          <a href="#pravacy" style={{ color: "#ccc", textDecoration: "none" }}>개인정보처리방침</a>
        </div>
      </div>
    </footer>
  )
}