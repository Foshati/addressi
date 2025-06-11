import dotenv from "dotenv";
dotenv.config();

// Import and execute swagger generation first

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from "./routes/auth.router";
import telRouter from "./routes/tel.router";
import { errorMiddleware } from "./utils/error-handler/error-handler";
import { apiReference } from '@scalar/express-api-reference';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// A more robust and configurable CORS setup
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3002").split(',');

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["set-cookie"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Body parsers
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

// Health check
app.get("/api/v1/health", (_req, res) => {
  res.json({ message: "Auth service is healthy!" });
});

// Auth routes
app.use("/api/v1/auth", authRouter);

// 5SIM Proxy routes
app.use("/api/v1/tel", telRouter);

// Global error handler
app.use(errorMiddleware as unknown as express.ErrorRequestHandler);

// Setup Scalar API Reference
const setupScalar = () => {
  try {
    // Get API specification
    const apiSpecPath = path.join(__dirname, 'doc', 'scalar-output.json');
    const apiSpec = JSON.parse(fs.readFileSync(apiSpecPath, 'utf8'));

    // Setup Scalar routes
    app.use(
      '/reference',
      apiReference({
        content: apiSpec,
        // You can choose from available themes: 'dark', 'light', 'material', etc.
        theme: 'purple'
      })
    );

    // Log the documentation URL for easy access
    console.log(`📚 API Documentation available at http://localhost:${PORT}/reference`);
  } catch (error) {
    console.error('❌ Failed to setup API documentation:', error);
  }
};

// Server
const PORT = parseInt(process.env.PORT || "8000", 10);
const SERVER = app.listen(PORT, () => {
  console.log(`✅ Auth service running at http://localhost:${PORT}/api/v1/health`);
  setupScalar();
});

SERVER.on("error", (err: NodeJS.ErrnoException) => {
  console.error("Auth service error:", err);
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${PORT} busy, retrying...`);
    setTimeout(() => {
      SERVER.close();
      SERVER.listen(PORT);
    }, 1000);
  }
});
