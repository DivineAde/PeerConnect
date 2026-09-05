"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid rendering theme-dependent UI until mounted, since the server
  // doesn't know the client's resolved theme — prevents a hydration
  // mismatch without needing a layout-shifting placeholder.
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-24" aria-hidden="true" />;

  return (
    <div role="radiogroup" aria-label="Theme" className="flex items-center gap-0.5 rounded-md border border-border-strong p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded transition-colors duration-150",
            theme === value ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
