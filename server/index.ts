import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Force development mode for our local environment
  process.env.NODE_ENV = "development";
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development" || process.env.NODE_ENV === "development") {
    console.log("Setting up Vite in development mode");
    await setupVite(app, server);
  } else {
    console.log("Setting up static serving");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  // Get port from environment variables, in priority order
  // REPLIT_PORT is specific to Replit's environment
  // PORT is a standard environment variable
  // 5000 is our fallback
  const port = process.env.REPLIT_PORT || process.env.PORT || 5000;
  
  // Log all available ports for debugging
  console.log("Available port variables:", {
    REPLIT_PORT: process.env.REPLIT_PORT,
    PORT: process.env.PORT,
    using: port
  });
  
  // Configure server with more robust options for Replit environment
  server.listen({
    port: Number(port),
    host: "0.0.0.0", // Listen on all network interfaces
    reusePort: true, // Allow port reuse
  }, () => {
    log(`serving on port ${port}`);
    // Additional logging to help with debugging
    console.log(`Server running at http://0.0.0.0:${port}`);
    console.log(`Server environment: ${process.env.NODE_ENV}`);
    console.log(`Replit domain: ${process.env.REPLIT_DOMAINS || "not available"}`);
  });
})();