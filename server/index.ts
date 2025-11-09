import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path"; // Keep path for logging middleware
// fs is no longer needed as local static serving is removed

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Redirect /uploads and /client/src/tender to R2 public URL
app.use(["/uploads", "/client/src/tender"], (req, res) => {
  const r2PublicUrl = process.env.VITE_R2_PUBLIC_URL;
  if (r2PublicUrl) {
    const redirectUrl = `${r2PublicUrl}${req.originalUrl}`;
    log(`Redirecting ${req.originalUrl} to ${redirectUrl}`);
    return res.redirect(302, redirectUrl);
  }
  // If R2_PUBLIC_URL is not set, proceed to next middleware (which might result in a 404)
  log(`VITE_R2_PUBLIC_URL not set, cannot redirect ${req.originalUrl}`);
  res.status(404).send("Asset server not configured.");
});

app.use((req, res, next) => {
  const start = Date.now();
  const currentPath = req.path; // Renamed 'path' to 'currentPath' to avoid conflict with imported 'path' module
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (currentPath.startsWith("/api")) { // Fixed: Use currentPath instead of path
      let logLine = `${req.method} ${currentPath} ${res.statusCode} in ${duration}ms`; // Fixed: Use currentPath
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
  if (app.get("env") !== "development") {
    serveStatic(app);
  }

  const server = await registerRoutes(app); // Reintroduce registerRoutes

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }

  // attempt startup seed once server and routes are ready
  try {
    const seed = (app as any).seedFromAssetsIfEmpty as undefined | (() => Promise<void>);
    if (typeof seed === "function") {
      await seed();
    }
  } catch {}

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5010 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5010', 10); // Changed default port to 5010
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
