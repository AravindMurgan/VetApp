import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { healthRouter } from "./routes/health";
import { errorHandler } from "./middleware/error-handler";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  app.use("/api/v1", healthRouter);

  app.use(errorHandler);

  return app;
}
