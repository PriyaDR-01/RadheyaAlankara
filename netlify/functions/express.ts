import serverless from 'serverless-http';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { registerRoutes } from '../../server/routes';

// Create an Express app and reuse the existing route registration.
const app = express();

// preserve rawBody for webhooks/signature verification like in server/index.ts
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req: any, _res: Response, buf: Buffer) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Minimal request logging for function runs
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`${req.method} ${req.path} (function)`);
  }
  next();
});

// Register routes from the server module (this attaches all /api routes)
// registerRoutes returns a Server but we don't call listen() in function mode.
(async () => {
  try {
    await registerRoutes(app as any);
    console.log('✅ Express routes registered for Netlify function');
  } catch (err) {
    console.error('Failed to register routes in function:', err);
  }
})();

// Export the handler using serverless-http
export const handler = serverless(app as any);

// Diagnostic info for debugging in deployed function environments
try {
  console.log('Function startup diagnostics:');
  console.log(' process.cwd():', process.cwd());
  // __dirname is available in CommonJS; in bundled ESM it will exist as a variable produced by esbuild
  try { console.log(' __dirname:', __dirname); } catch (e) { console.log(' __dirname not available'); }
  // Attempt to list copied data directory if present
  import('fs').then(fsmod => {
    const dataDir = `${process.cwd()}/netlify/functions/data`;
    fsmod.promises.readdir(dataDir).then(files => {
      console.log(' netlify/functions/data contents:', files);
    }).catch(() => {
      console.log(' netlify/functions/data not found or not readable');
    });
  }).catch(() => {
    console.log(' fs module import failed for diagnostics');
  });
} catch (e) {
  console.error('Diagnostics logging failed:', e);
}
