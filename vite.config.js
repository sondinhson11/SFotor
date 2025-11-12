import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Base URL: "/" for custom domain, "/SFotor/" for GitHub Pages
// Will be determined at runtime based on the domain
export default defineConfig({
  plugins: [react()],
  base: process.env.CUSTOM_DOMAIN === "true" ? "/" : "/SFotor/",
  build: {
    outDir: "dist",
  },
});
