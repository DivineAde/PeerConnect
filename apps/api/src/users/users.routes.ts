import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as usersController from "./users.controller";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get("/", usersController.discover);
usersRouter.get("/:id", usersController.getById);
