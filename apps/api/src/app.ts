import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { errorHandler } from "./middleware/error-handler";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ credentials: true }));
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(cookieParser());

  // Deliberately public, unlike the rest of /api/v1: hosting platforms (e.g. Render)
  // probe this route without credentials to determine service liveness.
  app.use("/api/v1", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", meRouter);

  app.use(errorHandler);

  return app;
}
