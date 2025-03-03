import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import { testConnection } from './db.config';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler to standardize error responses
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Get status code
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Determine error type
    const errorType = err.name || 'Error';
    
    // Additional details for development environment
    const details = app.get('env') === 'development' 
      ? {
          stack: err.stack,
          code: err.code,
          ...(err.errors && { validationErrors: err.errors })
        } 
      : undefined;
    
    // Log the error
    console.error(`Error (${status}): ${message}`, details || '');
    
    // Send standardized response
    res.status(status).json({
      success: false,
      error: {
        type: errorType,
        message,
        status,
        ...(details && { details })
      }
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the PORT from .env, defaulting to 5000 if not provided
  // Note: Replit expects port 5000, but the .env can override this
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Test database connection before starting the server
  await testConnection();
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
