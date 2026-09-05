import type { Request, Response } from "express";
import { updateAccountSchema } from "@peerconnect/validation";
import { asyncHandler } from "../common/asyncHandler";
import { sendSuccess } from "../common/apiResponse";
import { toPrivateUserDTO } from "../common/dto";
import * as accountService from "./account.service";

export const getAccount = asyncHandler(async (req: Request, res: Response) => {
  const user = await accountService.getMyAccount(req.userId!);
  return sendSuccess(res, { user: toPrivateUserDTO(user) });
});

export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAccountSchema.parse(req.body);
  const user = await accountService.updateMyAccount(req.userId!, input);
  return sendSuccess(res, { user: toPrivateUserDTO(user) });
});
