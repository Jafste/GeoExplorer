import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
var proxyTarget = process.env.VITE_PROXY_TARGET;
export default defineConfig({
    plugins: [react(), tailwindcss()],
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
            }
            : undefined,
    },
});
