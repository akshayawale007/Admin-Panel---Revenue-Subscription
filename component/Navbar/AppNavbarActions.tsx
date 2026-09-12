"use client"

import { ReactNode } from "react"

type AppNavbarActionsProps = {
  children: ReactNode
  className?: string
}

/** Wrap navbar action buttons — horizontal, auto width on all breakpoints. */
export function AppNavbarActions({ children, className = "" }: AppNavbarActionsProps) {
  return (
    <div
      className={`flex shrink-0 flex-row flex-wrap items-center justify-end gap-2 [&_button]:w-auto [&_button]:shrink-0 ${className}`}
    >
      {children}
    </div>
  )
}
