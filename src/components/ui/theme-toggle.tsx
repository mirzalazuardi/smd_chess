"use client";

import { useState, useEffect } from "react";

type Theme = "light" | "dark";

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return null;
}

function readUrlTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const urlTheme = params.get("theme");
  if (urlTheme === "dark" || urlTheme === "light") return urlTheme;
  return null;
}

function resolveInitialTheme(): Theme {
  const urlTheme = readUrlTheme();
  if (urlTheme) return urlTheme;

  const stored = readStoredTheme();
  if (stored) return stored;

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = resolveInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  }

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        <span className="text-lg opacity-0">🌙</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
    >
      <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
