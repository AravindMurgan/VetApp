import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { ownersRouter } from "./routes/owners";
import { patientsRouter } from "./routes/patients";
import { casesRouter } from "./routes/cases";
import { dashboardRouter } from "./routes/dashboard";
import { errorHandler } from "./middleware/error-handler";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(cookieParser());

  // Deliberately public, unlike the rest of /api/v1: hosting platforms (e.g. Render)
  // probe this route without credentials to determine service liveness.
  app.use("/api/v1", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", meRouter);
  app.use("/api/v1/owners", ownersRouter);
  app.use("/api/v1/patients", patientsRouter);
  app.use("/api/v1/cases", casesRouter);
  app.use("/api/v1/dashboard", dashboardRouter);

  app.use(errorHandler);

  return app;
}
