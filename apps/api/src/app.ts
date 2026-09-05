import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOrigins } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { passport } from "./auth/passport";
import { authRouter } from "./auth/auth.routes";
import { usersRouter } from "./users/users.routes";
import { accountRouter } from "./account/account.routes";
import { connectionsRouter } from "./connections/connections.routes";

export function createApp() {
  const app = express();

  // Trust the first proxy hop (Render/Railway/Vercel all sit behind one),
  // which is required for req.ip and `secure` cookies to behave correctly.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // The API only ever serves JSON, so a strict default CSP has no
      // upside and can only misfire against tooling like Postman/Swagger.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(requestLogger);

  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/connections", connectionsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
