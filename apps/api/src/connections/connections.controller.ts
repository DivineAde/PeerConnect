import type { Request, Response } from "express";
import { connectionActionSchema } from "@peerconnect/validation";
import { asyncHandler } from "../common/asyncHandler";
import { sendSuccess } from "../common/apiResponse";
import * as connectionsService from "./connections.service";

export const listConnections = asyncHandler(async (req: Request, res: Response) => {
  const connections = await connectionsService.listAcceptedConnections(req.userId!);
  return sendSuccess(res, { connections });
});

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const requests = await connectionsService.listIncomingRequests(req.userId!);
  return sendSuccess(res, { requests });
});

export const listSent = asyncHandler(async (req: Request, res: Response) => {
  const sent = await connectionsService.listOutgoingRequests(req.userId!);
  return sendSuccess(res, { sent });
});

export const sendRequest = asyncHandler(async (req: Request, res: Response) => {
  const connection = await connectionsService.sendConnectionRequest(req.userId!, req.params.userId);
  return sendSuccess(res, { connection }, 201);
});

export const respond = asyncHandler(async (req: Request, res: Response) => {
  const { action } = connectionActionSchema.parse(req.body);
  const connection = await connectionsService.respondToRequest(req.userId!, req.params.id, action);
  return sendSuccess(res, { connection });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await connectionsService.removeConnection(req.userId!, req.params.id);
  return sendSuccess(res, result);
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await connectionsService.getNetworkSummary(req.userId!);
  return sendSuccess(res, data);
});
