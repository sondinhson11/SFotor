import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Base URL: "/" for custom domain, "/SFotor/" for GitHub Pages
// Will be determined at runtime based on the domain
const isGithubDeploy = process.env.DEPLOY_TARGET === "github";

export default defineConfig({
  plugins: [react()],
  base: isGithubDeploy ? "/SFotor/" : "/",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        // Code splitting: tách các chunk lớn
        manualChunks: {
          // Tách vendor libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Tách SweetAlert2
          sweetalert2: ["sweetalert2"],
        },
      },
    },
    // Tối ưu chunk size
    chunkSizeWarningLimit: 1000,
  },
});
