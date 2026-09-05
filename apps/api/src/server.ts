import { createApp } from "./app";
import { env, googleOAuthEnabled } from "./config/env";
import { logger } from "./common/logger";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`PeerConnect API listening on port ${env.PORT}`, {
    env: env.NODE_ENV,
    googleOAuthEnabled,
  });
});
