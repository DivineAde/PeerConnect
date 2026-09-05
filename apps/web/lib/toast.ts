import { toast as sonnerToast } from "sonner";

// Thin wrapper so call sites read as intent ("toast.success(...)")
// rather than importing sonner directly everywhere, and so we have one
// place to keep messaging tone consistent.
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
};
