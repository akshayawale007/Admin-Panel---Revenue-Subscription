"use client"

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"
import { setSidebar } from "@/src/redux/slices/authSlices"
import { useAppDispatch, useAppSelector } from "@/src/redux/store"

type NavigationToggleProps = {
  className?: string
}

/**
 * Mobile sidebar toggle — visible below `lg` breakpoint only.
 * Wire into the new App Navbar; does not replace Common/Navbar.
 */
export function NavigationToggle({ className = "" }: NavigationToggleProps) {
  const sidebarOpen = useAppSelector((state) => state.auth.sidebar)
  const dispatch = useAppDispatch()

  return (
    <button
      type="button"
      aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={sidebarOpen}
      onClick={() => dispatch(setSidebar(!sidebarOpen))}
      className={`shrink-0 cursor-pointer rounded-lg p-1 text-(--yoco-text) transition-colors hover:bg-(--yoco-row-hover) lg:hidden ${className}`}
    >
      {sidebarOpen ? (
        <XMarkIcon className="h-6 w-6 text-(--yoco-text)" />
      ) : (
        <Bars3Icon className="h-6 w-6 text-(--yoco-text)" />
      )}
    </button>
  )
}
