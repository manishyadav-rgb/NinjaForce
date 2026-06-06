import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({ eyebrow, title, description, align = "left" }: SectionHeaderProps) {
  return (
    <div className={cn("mb-8", align === "center" && "mx-auto max-w-narrow text-center")}>
      {eyebrow ? <p className="mb-2 text-sm font-bold uppercase text-brand-primary">{eyebrow}</p> : null}
      <h2 className="font-display text-3xl font-black text-text-main text-balance">{title}</h2>
      {description ? <p className="mt-3 text-base leading-relaxed text-text-muted text-pretty">{description}</p> : null}
    </div>
  );
}

