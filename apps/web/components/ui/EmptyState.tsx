import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

// The one, shared shape for "nothing here yet" moments across the app,
// per the brief: never a blank screen, always an explanation plus a
// next step.
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
      {icon}
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="max-w-xs text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
