import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "fs";

const reactPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "node_modules/react/package.json"), "utf-8")
);
const reactLeafletPkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "node_modules/react-leaflet/package.json"), "utf-8")
);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __REACT_VERSION__: JSON.stringify(reactPkg.version),
    __REACT_LEAFLET_VERSION__: JSON.stringify(reactLeafletPkg.version),
  },
}));

