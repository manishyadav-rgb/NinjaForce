import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "sale" | "soft" | "accent" | "secondary";

const variants: Record<BadgeVariant, string> = {
  sale: "bg-accent-sale text-text-inverse",
  soft: "bg-background-soft text-text-main border border-border",
  accent: "bg-brand-accent text-text-main",
  secondary: "bg-brand-secondary text-text-inverse",
};

export function Badge({ className, variant = "soft", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", variants[variant], className)} {...props} />;
}

