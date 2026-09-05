import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as connectionsController from "./connections.controller";

export const connectionsRouter = Router();

connectionsRouter.use(requireAuth);
connectionsRouter.get("/", connectionsController.listConnections);
connectionsRouter.get("/requests", connectionsController.listRequests);
connectionsRouter.get("/sent", connectionsController.listSent);
connectionsRouter.get("/summary", connectionsController.summary);
connectionsRouter.post("/:userId", connectionsController.sendRequest);
connectionsRouter.patch("/:id", connectionsController.respond);
connectionsRouter.delete("/:id", connectionsController.remove);
