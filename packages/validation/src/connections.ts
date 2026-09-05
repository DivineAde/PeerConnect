import { z } from "zod";

export const connectionActionSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});
export type ConnectionActionInput = z.infer<typeof connectionActionSchema>;

export const discoverQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
export type DiscoverQueryInput = z.infer<typeof discoverQuerySchema>;
