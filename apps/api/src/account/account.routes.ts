import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as accountController from "./account.controller";

export const accountRouter = Router();

accountRouter.use(requireAuth);
accountRouter.get("/", accountController.getAccount);
accountRouter.patch("/", accountController.updateAccount);
