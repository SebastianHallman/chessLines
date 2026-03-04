import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ChessLines",
        short_name: "ChessLines",
        description: "Drill chess opening lines from PGN",
        theme_color: "#01161E",
        background_color: "#01161E",
        display: "standalone",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
});
