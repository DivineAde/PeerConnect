import type { Request, Response } from "express";
import { discoverQuerySchema } from "@peerconnect/validation";
import { asyncHandler } from "../common/asyncHandler";
import { sendSuccess } from "../common/apiResponse";
import * as usersService from "./users.service";

export const discover = asyncHandler(async (req: Request, res: Response) => {
  const query = discoverQuerySchema.parse(req.query);
  const result = await usersService.discoverUsers(req.userId!, query);
  return sendSuccess(res, result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const profile = await usersService.getUserProfile(req.userId!, req.params.id);
  return sendSuccess(res, { user: profile });
});
