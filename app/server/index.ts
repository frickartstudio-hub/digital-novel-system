import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import path from "path";
import fs from "node:fs/promises";
import { fileURLToPath } from "url";
import apiRouter from "./routes/index";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { initDb } from "./db/pool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
  await initDb();

  const app = express();
  const server = createServer(app);

  app.use(
    morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
      skip: () => env.NODE_ENV === "test",
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use("/api", apiRouter);
  app.use("/api", notFoundHandler);
  app.use("/api", errorHandler);

  // Serve uploaded assets
  app.use("/uploads", express.static(env.UPLOAD_DIR));

  // Serve static files from dist/public in production
  const staticPath =
    env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  server.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}/`);
  });
}

startServer().catch(error => {
  console.error("Failed to start server", error);
  process.exit(1);
});
