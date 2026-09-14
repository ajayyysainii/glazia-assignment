import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import router from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", router);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
