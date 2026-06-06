"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

const themes = ["default", "earthy", "pastel", "luxury"];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("default");

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "default" ? "" : theme;
  }, [theme]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-background-elevated p-2 shadow-soft">
      {themes.map((item) => (
        <Button key={item} type="button" size="sm" variant={theme === item ? "primary" : "ghost"} onClick={() => setTheme(item)}>
          {item}
        </Button>
      ))}
    </div>
  );
}

