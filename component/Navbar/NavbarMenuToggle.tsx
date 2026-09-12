"use client"

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"

type NavbarMenuToggleProps = {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

/**
 * Toggles the collapsible navbar actions panel on mobile (Flowbite-style).
 * Separate from NavigationToggle which opens the app sidebar drawer.
 */
export function NavbarMenuToggle({ isOpen, onToggle, className = "" }: NavbarMenuToggleProps) {
  return (
    <button
      type="button"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      onClick={onToggle}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-2 text-(--yoco-text) transition-colors hover:bg-(--yoco-row-hover) md:hidden ${className}`}
    >
      {isOpen ? (
        <XMarkIcon className="h-6 w-6 text-(--yoco-text)" />
      ) : (
        <Bars3Icon className="h-6 w-6 text-(--yoco-text)" />
      )}
    </button>
  )
}
