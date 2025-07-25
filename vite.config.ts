// // vite.config.ts
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       // /api/* 로 들어오는 요청을 8080 서버로 포워딩
//       "/api": {
//         target: "http://localhost:8080",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
//   base: '/tour-frontend-deploy/',
//   // base는 리포지토리명과 동일하게 가져갑니다.
// });
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tour-frontend-deploy/',
  // base는 리포지토리명과 동일하게 가져갑니다.
  plugins: [react()],
});
