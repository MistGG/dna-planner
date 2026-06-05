import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub Pages project site: https://mistgg.github.io/dna-planner/ */
const base = process.env.GITHUB_PAGES === "true" ? "/dna-planner/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
});
