"use client";

import { useEffect, useState } from "react";

function BulbMark({ lit, className }: { lit: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path
        d="M12 3a6 6 0 0 1 6 6c0 2.5-1.5 3.8-2.2 5-.4.7-.8 1.4-.8 2H9c0-.6-.4-1.3-.8-2C7.5 12.8 6 11.5 6 9a6 6 0 0 1 6-6Z"
        fill={lit ? "currentColor" : "none"}
        fillOpacity={lit ? 0.25 : undefined}
      />
      {lit && (
        <>
          <path d="M12 0.5v1.5" />
          <path d="M4.5 4.5l1 1" />
          <path d="M19.5 4.5l-1 1" />
        </>
      )}
    </svg>
  );
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Apagar la lámpara" : "Encender la lámpara"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-hairline text-ink-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <BulbMark lit={isDark} className="h-5 w-5" />
    </button>
  );
}
