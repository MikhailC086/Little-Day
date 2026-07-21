import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the build work on GitHub Pages under any repo name
// (e.g. username.github.io/little-day/) without extra configuration.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
