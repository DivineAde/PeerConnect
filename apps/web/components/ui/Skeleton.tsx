import { cn } from "@/lib/utils";

// A single, understated pulse — used everywhere loading state is
// needed instead of ad hoc spinners, so the app's "waiting" moments
// feel consistent.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface", className)} aria-hidden="true" />;
}
