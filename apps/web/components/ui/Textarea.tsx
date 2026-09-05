"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "w-full rounded-md border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-faint",
          "transition-colors duration-150 resize-none",
          error ? "border-danger" : "border-border-strong hover:border-ink-faint",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
