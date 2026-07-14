import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "VetLog",
        short_name: "VetLog",
        description: "Case logging, patient history, and follow-ups for a solo vet clinic.",
        theme_color: "#0e6b5c",
        background_color: "#faf8f4",
        display: "standalone",
        start_url: "/today",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icons/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App-shell precache: every built asset, so the shell loads offline;
        // API calls are same-origin XHR/fetch, left to the network as usual.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
