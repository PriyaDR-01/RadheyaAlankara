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
      
      // Copy data files to public/api directory for static serving
      const dataSrcDir = path.resolve(import.meta.dirname, "data");
      const dataDestDir = path.resolve(import.meta.dirname, "dist/public/api");
      
      // Create api directory
      fs.mkdirSync(dataDestDir, { recursive: true });
      
      // Copy individual JSON files to match API endpoints
      fs.copyFileSync(path.join(dataSrcDir, "products.json"), path.join(dataDestDir, "products.json"));
      fs.copyFileSync(path.join(dataSrcDir, "categories.json"), path.join(dataDestDir, "categories.json"));
      fs.copyFileSync(path.join(dataSrcDir, "orders.json"), path.join(dataDestDir, "orders.json"));
      fs.copyFileSync(path.join(dataSrcDir, "users.json"), path.join(dataDestDir, "users.json"));
      
      // Create endpoint-specific files
      const products = JSON.parse(fs.readFileSync(path.join(dataSrcDir, "products.json"), 'utf-8'));
      const categories = JSON.parse(fs.readFileSync(path.join(dataSrcDir, "categories.json"), 'utf-8'));
      
      // Create products subdirectory
      fs.mkdirSync(path.join(dataDestDir, "products"), { recursive: true });
      
      // Best sellers
      const bestSellers = products.filter((p: any) => p.isBestSeller === 1);
      fs.writeFileSync(path.join(dataDestDir, "products", "best-sellers.json"), JSON.stringify(bestSellers, null, 2));
      
      // New arrivals
      const newArrivals = products.filter((p: any) => p.isNewArrival === 1);
      fs.writeFileSync(path.join(dataDestDir, "products", "new-arrivals.json"), JSON.stringify(newArrivals, null, 2));
      
      // Products by category
      const productsByCategory: Record<string, any[]> = {};
      products.forEach((product: any) => {
        if (!productsByCategory[product.category]) {
          productsByCategory[product.category] = [];
        }
        productsByCategory[product.category].push(product);
      });
      
      // Create category directories and files
      Object.entries(productsByCategory).forEach(([category, categoryProducts]) => {
        fs.writeFileSync(
          path.join(dataDestDir, "products", `${category}.json`), 
          JSON.stringify(categoryProducts, null, 2)
        );
      });
      
      console.log('✅ Copied data files to public/api directory for static serving');
    }
  };
}

// Plugin to serve attached_assets during development
function devAssetsPlugin() {
  return {
    name: 'dev-assets',
    configureServer(server: { middlewares: { use: (arg0: string, arg1: (req: any, res: any, next: any) => void) => void; }; }) {
      server.middlewares.use('/attached_assets', (req, res, next) => {
        const filePath = path.join(import.meta.dirname, 'attached_assets', req.url || '');
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Content-Type', 'image/png'); // Adjust content type as needed
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    devAssetsPlugin(), // Serve assets during development
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
  server: {
    fs: {
      strict: false, // Allow access to files outside root
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "attached_assets"),
        '..' // Allow serving files from parent directory
      ]
    },
  },
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
});
