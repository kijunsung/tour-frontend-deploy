import { Box, Typography, Card, CardHeader, CardContent } from "@mui/material";
import { Link } from "react-router-dom";
import { styled } from "@mui/system";

export default function MainPage() {

  // styled Box로 Hero 배경 장식 구현
  // eslint-disable-next-line no-empty-pattern
  const HeroSection = styled(Box)(({ }) => ({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40vh",
    textAlign: "center",
    width: "100%",
    margin: 0,
    padding: "32px 16px",
    backgroundImage: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
    overflow: "hidden",

    "&::before": {
      content: '""',
      position: "absolute",
      top: "-50%",
      right: "-10%",
      width: "500px",
      height: "500px",
      background: "rgba(255, 193, 7, 0.3)",
      borderRadius: "50%",
      zIndex: 0,
    },
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: "-30%",
      left: "-10%",
      width: "400px",
      height: "400px",
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "50%",
      zIndex: 0,
    },
  }));

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 80px)",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        width: "100%",
        flex: 1,
      }}
    >
      {/* 메인 헤로 섹션 */}
      <HeroSection>
        <Typography
          variant="h2"
          sx={{
            mb: 2,
            fontWeight: "bold",
            color: "#fff",
            zIndex: 1,
          }}
        >
          스마트한 여행 계획의 시작
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            color: "#fff",
            maxWidth: "600px",
            zIndex: 1,
          }}
        >
          지도, 날씨, 교통 정보를 한 번에 확인하고 완벽한 여행을 계획하세요
        </Typography>
        <Link
          to="/tour-list"
          style={{
            textDecoration: "none",
            display: "inline-block",
            padding: "12px 32px", // py: 1.5, px: 4와 동일
            fontSize: "1.1rem",
            fontWeight: "500",
            backgroundColor: "#63a7eb",
            color: "#fff",
            borderRadius: "50px",
            border: "solid 2px #fff",
            transition: "all 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLAnchorElement).style.backgroundColor = "#fff";
            (e.target as HTMLAnchorElement).style.color = "#63a7eb";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLAnchorElement).style.backgroundColor = "#63a7eb";
            (e.target as HTMLAnchorElement).style.color = "#fff";
          }}
        >
          여행 계획 시작하기
        </Link>
      </HeroSection>

      {/* 기능 소개 섹션 */}
      <Box
        sx={{
          width: "100%",
          backgroundColor: "white",
          margin: 0,
          padding: "64px 16px",
        }}
      >
        <Box sx={{ width: "100%", margin: 0, padding: 0 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              mb: 6,
              fontWeight: "bold",
              color: "#333",
            }}
          >
            어디로든 문의 주요 기능
          </Typography>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <Card
              sx={{
                flex: 1,
                maxWidth: 350,
                boxShadow: 3,
                borderRadius: "5%",
                padding: "1rem 0",
              }}
            >
              <CardHeader
                title={
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      backgroundColor: "#398ee3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      fontSize: "2.5rem",
                    }}
                  >
                    🗺️
                  </Box>
                }
                sx={{
                  textAlign: "center",
                  fontSize: "3rem",
                }}
              />
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  지도 통합
                </Typography>
                <Typography color="text.secondary">카카오 지도 API를 활용하여 여행지 정보를 한눈에 확인하고 경로를 계획할 수 있습니다.</Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                flex: 1,
                maxWidth: 350,
                boxShadow: 3,
                borderRadius: "5%",
                padding: "1rem 0",
              }}
            >
              <CardHeader
                title={
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      backgroundColor: "#398ee3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      fontSize: "2.5rem",
                    }}
                  >
                    🌤️
                  </Box>
                }
                sx={{
                  textAlign: "center",
                  fontSize: "3rem",
                }}
              />
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  날씨 정보
                </Typography>
                <Typography color="text.secondary">실시간 날씨 정보를 확인하여 여행 계획에 맞는 최적의 일정을 세울 수 있습니다.</Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                flex: 1,
                maxWidth: 350,
                boxShadow: 3,
                borderRadius: "5%",
                padding: "1rem 0",
              }}
            >
              <CardHeader
                title={
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      backgroundColor: "#398ee3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      fontSize: "2.5rem",
                    }}
                  >
                    🚗
                  </Box>
                }
                sx={{
                  textAlign: "center",
                  fontSize: "3rem",
                }}
              />
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  교통 정보
                </Typography>
                <Typography color="text.secondary">실시간 교통 상황과 대중교통 정보를 제공하여 효율적인 이동 경로를 안내합니다.</Typography>
              </CardContent>
            </Card>
          </div>
        </Box>
      </Box>
    </Box>
  );
}
