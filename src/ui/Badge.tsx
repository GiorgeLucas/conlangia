import type { ReactNode } from "react";

type BadgeVariant = "accent" | "success" | "neutral";
type BadgeSize = "xs" | "sm";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  mono?: boolean;
  className?: string;
  title?: string;
  onClick?: () => void;
  "aria-label"?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const dotClasses: Record<BadgeVariant, string> = {
  accent: "bg-violet-500",
  success: "bg-emerald-500",
  neutral: "bg-zinc-400",
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-[11px]",
  sm: "px-2.5 py-0.5 text-xs",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  mono = false,
  className = "",
  title,
  onClick,
  "aria-label": ariaLabel,
}: BadgeProps) {
  const classes = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium leading-5 transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${
    mono ? "font-mono" : ""
  } ${
    onClick
      ? "cursor-pointer hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:brightness-110"
      : ""
  } ${className}`;

  const content = (
    <>
      {dot && (
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${dotClasses[variant]}`}
        />
      )}
      {children}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={classes}
      >
        {content}
      </button>
    );
  }

  return (
    <span title={title} aria-label={ariaLabel} className={classes}>
      {content}
    </span>
  );
}
