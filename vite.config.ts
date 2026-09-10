import { defineConfig } from "vite";

export default defineConfig({
  server: { host: "0.0.0.0", port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@firebase/firestore") || id.includes("firebase/firestore")) {
            return "vendor-firestore";
          }
          if (id.includes("@firebase/auth") || id.includes("firebase/auth")) {
            return "vendor-auth";
          }
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "vendor-firebase-core";
          }
        },
      },
    },
  },
});