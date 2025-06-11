import dotenv from "dotenv";
dotenv.config();

// Import and execute swagger generation first

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


import { apiReference } from '@scalar/express-api-reference';
import { errorMiddleware } from "./utils/error-handler/error-handler";
import authRouter from "./routes/auth.router";
import telRouter from "./routes/tel.router";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// A more robust and configurable CORS setup
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000").split(',');

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from any localhost origin during development
      if (!origin || (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:'))) {
        callback(null, true);
      } else {
        const allowed = allowedOrigins.includes(origin);
        if (allowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
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
app.use("/", authRouter);

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
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  setupScalar();
});
