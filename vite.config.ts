import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

// Plugin to copy attached_assets to build output
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    writeBundle() {
      const srcDir = path.resolve(import.meta.dirname, "attached_assets");
      const destDir = path.resolve(import.meta.dirname, "dist/public/attached_assets");
      
      // Copy the entire attached_assets directory
      fs.cpSync(srcDir, destDir, { recursive: true });
      console.log('✅ Copied attached_assets to build directory');
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    copyAssetsPlugin(), // Add our custom plugin
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep original names for images from attached_assets
          if (assetInfo.name && assetInfo.name.includes('attached_assets')) {
            return 'attached_assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  server: {
    fs: {
      strict: false, // Allow access to files outside root
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "attached_assets")
      ]
    },
  },
});
