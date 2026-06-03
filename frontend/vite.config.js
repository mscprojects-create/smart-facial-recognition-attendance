import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api -> Flask backend so the frontend can call the Python API
// without CORS headaches during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
