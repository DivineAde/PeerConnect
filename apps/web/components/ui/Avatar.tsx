import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

export function Avatar({ name, avatarUrl, size = "md", className }: AvatarProps) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "flex items-center justify-center rounded-full bg-accent-soft font-semibold text-accent",
        sizeClasses[size],
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
