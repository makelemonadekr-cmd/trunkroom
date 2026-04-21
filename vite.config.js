import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy all /api/* requests to the Express server
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
