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
