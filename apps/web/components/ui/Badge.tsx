import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface text-ink-muted border-border-strong",
  accent: "bg-accent-soft text-accent border-transparent",
  success: "bg-success/10 text-success border-transparent",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
