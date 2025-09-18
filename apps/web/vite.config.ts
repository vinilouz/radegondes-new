import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = env.ALLOWED_URL ? [env.ALLOWED_URL] : [];

  return {
    plugins: [
      tailwindcss(),
      tanstackRouter({}),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "radegondes",
          short_name: "radegondes",
          description: "radegondes - PWA Application",
          theme_color: "#0c0c0c",
        },
        pwaAssets: { disabled: false, config: true },
        devOptions: { enabled: true },
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: { allowedHosts },
    preview: { allowedHosts }
  };
});
