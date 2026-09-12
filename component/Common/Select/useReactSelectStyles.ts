"use client"

import { useMemo } from "react"
import { useTheme } from "@/component/Common/Theme/ThemeProvider"
import { getReactSelectStyles } from "./reactSelectTheme"

type UseReactSelectStylesOptions = {
  isDisabled?: boolean
  minHeight?: number | string
  fontSize?: string
  fontWeight?: number | string
  /** Compact form dropdowns (Add College / University) */
  compact?: boolean
  menuListMaxHeight?: string
  /** Left padding when a search icon sits inside the control */
  valueContainerPaddingLeft?: number | string
}

export function useReactSelectStyles(options?: UseReactSelectStylesOptions) {
  const { theme } = useTheme()

  return useMemo(() => {
    const base = getReactSelectStyles(theme === "dark", {
      isDisabled: options?.isDisabled,
    })

    const minHeight = options?.minHeight ?? 38
    const fontSize = options?.fontSize ?? "14px"
    const fontWeight = options?.fontWeight ?? 700
    const themedOption = base.option

    const styles = {
      ...base,
      menuPortal: (portalBase: object) => ({ ...portalBase, zIndex: 9999 }),
      control: (controlBase: object) => {
        const themed = base.control(controlBase)
        return {
          ...themed,
          minHeight,
          // Let height grow naturally with wrapped chips instead of pinning it
          // to a stale single-line value — this was the root cause of the
          // "×" / chevron floating out of bounds when chips wrapped to 2+ lines.
          height: options?.compact ? minHeight : "auto",
          alignItems: "flex-start" as const,
          fontSize,
          fontWeight,
          borderRadius: "4px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }
      },
      // Ensure chips wrap and align to the top instead of centering against
      // the full multi-line height of the control.
      valueContainer: (valueBase: object) => ({
        ...valueBase,
        flexWrap: "wrap" as const,
        alignItems: "flex-start" as const,
        padding: options?.compact ? "0 8px" : "6px 8px",
      }),
      // Pin the clear (×) and dropdown indicators to the top row so they
      // don't visually float mid-block when the value container grows.
      indicatorsContainer: (indicatorBase: object) => ({
        ...indicatorBase,
        alignItems: "flex-start" as const,
        paddingTop: "6px",
      }),
    }

    if (options?.compact) {
      const paddingLeft = options.valueContainerPaddingLeft ?? "8px"
      return {
        ...styles,
        valueContainer: (valueBase: object) => ({
          ...valueBase,
          padding: "0 8px",
          paddingLeft,
          height: minHeight,
        }),
        indicatorsContainer: (indicatorBase: object) => ({
          ...indicatorBase,
          height: minHeight,
        }),
        option: (optionBase: object, state: { isFocused: boolean; isSelected: boolean }) => ({
          ...themedOption(optionBase, state),
          padding: "4px 12px",
          fontSize: "13px",
        }),
        menuList: (listBase: object) => ({
          ...listBase,
          maxHeight: options.menuListMaxHeight ?? "150px",
        }),
      }
    }

    return styles
  }, [
    theme,
    options?.isDisabled,
    options?.minHeight,
    options?.fontSize,
    options?.fontWeight,
    options?.compact,
    options?.menuListMaxHeight,
    options?.valueContainerPaddingLeft,
  ])
}
