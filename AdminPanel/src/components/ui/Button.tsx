import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-primary text-text-inverse shadow-glow hover:bg-brand-secondary",
  secondary: "bg-brand-secondary text-text-inverse hover:bg-brand-primary",
  ghost: "bg-transparent text-text-main hover:bg-background-soft",
  outline: "border border-border bg-background-elevated text-text-main hover:border-brand-primary hover:text-brand-primary",
};

const sizes: Record<Size, string> = {
  sm: "h-button-sm px-4 text-sm",
  md: "h-button px-5 text-sm",
  lg: "h-button-lg px-8 text-base",
};

const base = "qh-focus inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-base disabled:pointer-events-none disabled:opacity-60";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({ className, variant = "primary", size = "md", href, children, ...props }: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}

