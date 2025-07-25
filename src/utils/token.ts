const TOKEN_KEY = 'token';// 토큰 저장

export const saveToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// 토큰 조회
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// 토큰 삭제
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// 토큰 존재 여부 확인
export const hasToken = (): boolean => {
  return !!localStorage.getItem(TOKEN_KEY);
};

// 토큰 유효성 검사 (JWT 디코딩)
export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // JWT 토큰 만료 시간 확인 (간단한 체크)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};


// 토큰 저장
export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};