"use client";

import { Camera, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({
  className,
  compact = false,
  withCamera = false,
  placeholder = "Search bedsheet",
}: {
  className?: string;
  compact?: boolean;
  withCamera?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    router.push(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "qh-focus w-full rounded-full border border-border bg-background-elevated pl-12 text-text-main shadow-soft transition-all duration-base placeholder:text-text-soft focus:border-brand-primary",
          compact ? "h-button-sm" : "h-button",
          withCamera ? "pr-16" : "pr-4",
        )}
      />
      {withCamera ? (
        <button
          type="button"
          className="qh-focus absolute right-3 top-1/2 inline-flex h-8 w-9 -translate-y-1/2 items-center justify-center border-l border-border-strong pl-3 text-text-main"
          aria-label="Search by image"
        >
          <Camera className="h-5 w-5" />
        </button>
      ) : null}
    </form>
  );
}

