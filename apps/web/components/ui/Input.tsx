"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "h-10 w-full rounded-md border bg-bg px-3 text-sm text-ink placeholder:text-ink-faint",
          "transition-colors duration-150",
          error ? "border-danger" : "border-border-strong hover:border-ink-faint",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
