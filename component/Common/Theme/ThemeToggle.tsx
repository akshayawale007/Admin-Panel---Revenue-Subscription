"use client"

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline"
import { useTheme } from "./ThemeProvider"

type ThemeToggleProps = {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = "", showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <div
        className={`h-9 w-9 shrink-0 rounded-lg bg-(--yoco-surface-muted) ${className}`}
        aria-hidden
      />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex cursor-pointer items-center gap-2 rounded-lg border border-(--yoco-border) bg-(--yoco-surface-muted) px-3 py-2 text-sm font-medium text-(--yoco-text) transition hover:border-(--yoco-primary) hover:bg-(--yoco-primary)/10 ${className}`}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5 shrink-0 text-amber-400" />
      ) : (
        <MoonIcon className="h-5 w-5 shrink-0 text-(--yoco-primary)" />
      )}
      {showLabel ? <span>{isDark ? "Light mode" : "Dark mode"}</span> : null}
    </button>
  )
}
