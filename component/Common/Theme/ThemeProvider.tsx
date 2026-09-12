"use client"

import { ConfigProvider, theme as antdTheme } from "antd"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "yoco-theme"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  localStorage.setItem(STORAGE_KEY, theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initial: Theme = stored === "dark" || stored === "light" ? stored : "light"
    setThemeState(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      applyTheme(next)
      return next
    })
  }, [])

  const antConfig = useMemo(
    () => ({
      algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#674d9f",
        borderRadius: 6,
        ...(theme === "dark"
          ? {
              colorBgContainer: "#221d2e",
              colorBgElevated: "#1c1728",
              colorText: "#ece6f8",
              colorTextPlaceholder: "#a898c8",
              colorBorder: "#3d3254",
              colorIcon: "#a898c8",
            }
          : {
              colorBgContainer: "#ffffff",
              colorText: "#3d2d5c",
              colorTextPlaceholder: "#6b5b8a",
              colorBorder: "#d1d5db",
            }),
      },
    }),
    [theme]
  )

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
      <ConfigProvider theme={antConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return ctx
}
