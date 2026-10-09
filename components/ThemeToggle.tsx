"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function resolve(t: Theme): "light" | "dark" {
  if (t !== "system") return t;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setTheme(saved);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
      document.documentElement.dataset.theme = resolve(next);
    } catch {}
  }

  const label = theme === "dark" ? "Switch to light theme" : theme === "light" ? "Use system theme" : "Switch to dark theme";
  const glyph = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🖥️";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="rounded-full border border-line bg-card px-2 py-1 text-sm hover:bg-soft"
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}