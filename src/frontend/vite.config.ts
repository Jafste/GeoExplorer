import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const proxyTarget = process.env.VITE_PROXY_TARGET;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("leaflet")) {
            return "map-vendor";
          }

          if (id.includes("@microsoft/signalr")) {
            return "signalr-vendor";
          }

          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }

          if (id.includes("react") || id.includes("scheduler")) {
            return "react-vendor";
          }

          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@databaseSeed": path.resolve(__dirname, "../database/seed"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
    proxy: proxyTarget
      ? {
          "/api": {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
          },
          "/hubs": {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
            ws: true,
          },
        }
      : undefined,
  },
});
