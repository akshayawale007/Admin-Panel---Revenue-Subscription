"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { MagnifyingGlassIcon, ChevronLeftIcon } from "@heroicons/react/24/outline"
import { AppNavbarActions } from "./AppNavbarActions"
import { NavigationToggle } from "./NavigationToggle"
import { NavbarMenuToggle } from "./NavbarMenuToggle"

export type AppNavbarProps = {
  title?: string
  subtitle?: string
  searchPlaceholder?: string | false
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Show a back arrow before the title */
  back?: boolean
  /** Called when the back button is clicked. Defaults to router.back() if not provided */
  onBack?: () => void
  /** When set, the title links here (e.g. Revenue home / overview) */
  titleHref?: string
  /** Buttons, links, BreadCumb — collapsible panel on mobile, inline on desktop */
  children?: ReactNode
  className?: string
}

const AppNavbar = ({
  title,
  subtitle,
  searchPlaceholder = false,
  searchValue,
  onSearchChange,
  back = false,
  onBack,
  titleHref,
  children,
  className = "",
}: AppNavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const showSearch = searchPlaceholder !== false && Boolean(searchPlaceholder)
  const showTitleBlock = Boolean(title || subtitle)
  const hasActions = Boolean(children)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Default: native browser back
      window.history.back()
    }
  }

  const searchInput = showSearch ? (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-(--yoco-text-muted)" />
      <input
        type="search"
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
        placeholder={searchPlaceholder as string}
        className="h-11 w-full rounded-full border-0 bg-(--yoco-search-bg) py-2 pr-4 pl-11 text-sm text-(--yoco-text) outline-none placeholder:text-(--yoco-text-muted)"
      />
    </div>
  ) : null

  return (
    <header
      className={`sticky top-0 z-50 w-full shrink-0 border-b border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) shadow-sm ${className}`}
    >
      <nav className="px-4 md:px-5">
        {/* Top row — brand + toggles */}
        <div className="flex min-h-16 w-full items-center gap-2 sm:gap-3">
          <NavigationToggle />

          {showTitleBlock ? (
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              {back && (
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Go back"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-(--yoco-text) transition-colors hover:bg-(--yoco-row-hover) active:bg-(--yoco-border)"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-(--yoco-text)" />
                </button>
              )}

              <div className="min-w-0 flex-1">
                {title ? (
                  titleHref ? (
                    <Link
                      href={titleHref}
                      className="truncate text-lg leading-tight font-bold text-(--yoco-text) no-underline hover:text-[#674D9F]"
                    >
                      {title}
                    </Link>
                  ) : (
                    <p className="truncate text-lg leading-tight font-bold text-(--yoco-text)">
                      {title}
                    </p>
                  )
                ) : null}
                {subtitle ? (
                  <p className="-mt-0.5 truncate text-sm font-semibold text-(--yoco-text-muted)">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          ) : showSearch ? (
            <div className="min-w-0 flex-1" aria-hidden />
          ) : null}

          {showSearch ? (
            <div className="hidden min-w-0 flex-1 px-2 md:block lg:px-6">
              <div className="mx-auto w-full max-w-xl">{searchInput}</div>
            </div>
          ) : null}

          {hasActions ? (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div className="hidden md:flex">
                <AppNavbarActions>{children}</AppNavbarActions>
              </div>
              <NavbarMenuToggle isOpen={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
            </div>
          ) : null}
        </div>

        {showSearch ? <div className="mt-3 w-full md:hidden">{searchInput}</div> : null}

        {hasActions ? (
          <div
            className={`flex justify-end border-(--yoco-border-subtle) px-4 py-2 md:hidden ${
              menuOpen ? "border-t" : "hidden"
            }`}
          >
            <AppNavbarActions>{children}</AppNavbarActions>
          </div>
        ) : null}
      </nav>
    </header>
  )
}

export default AppNavbar
