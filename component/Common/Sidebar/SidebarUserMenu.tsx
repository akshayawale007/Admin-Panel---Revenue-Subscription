"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRightOnRectangleIcon, ChevronUpIcon } from "@heroicons/react/24/outline"
import { logOutAsync } from "@/src/redux/slices/authSlices"
import { useAppDispatch } from "@/src/redux/store"
import { toast } from "react-toastify"
import ThemeToggle from "@/component/Common/Theme/ThemeToggle"

type UserProfile = {
  name: string
  subtitle: string
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A"
  )
}

function readUserProfile(): UserProfile {
  if (typeof window === "undefined") {
    return { name: "Admin", subtitle: "Super Admin" }
  }

  try {
    const raw = localStorage.getItem("userData")
    if (!raw) return { name: "Admin", subtitle: "Super Admin" }

    const data = JSON.parse(raw) as Record<string, unknown>
    const name =
      (data?.name as string) || (data?.fullName as string) || (data?.userName as string) || "Admin"
    const subtitle =
      (data?.email as string) ||
      (data?.roleName as string) ||
      ((data?.role as { name?: string })?.name ?? "") ||
      "Super Admin"

    return { name, subtitle }
  } catch {
    return { name: "Admin", subtitle: "Super Admin" }
  }
}

type SidebarUserMenuProps = {
  /** e.g. close mobile drawer after logout */
  onAfterAction?: () => void
}

export function SidebarUserMenu({ onAfterAction }: SidebarUserMenuProps) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({ name: "Admin", subtitle: "Super Admin" })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setProfile(readUserProfile())
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const onLogout = async () => {
    setOpen(false)
    try {
      await dispatch(logOutAsync()).unwrap()
      toast.dismiss()
      toast.success("Logout Successful", { autoClose: 1500 })
      onAfterAction?.()
    } catch {
      toast.dismiss()
      toast.error("Logout failed")
    }
  }

  const initials = getInitials(profile.name)

  return (
    <div
      ref={containerRef}
      className="relative shrink-0 border-t border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) p-3"
    >
      {/* Popover menu (opens above profile row) */}
      {open && (
        <div className="absolute right-3 bottom-full left-3 z-50 mb-2 overflow-hidden rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) shadow-[0_4px_24px_var(--yoco-shadow)]">
          <div className="flex items-center gap-3 border-b border-(--yoco-border-subtle) px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#674D9F] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-(--yoco-text)">{profile.name}</p>
              <p className="truncate text-xs text-(--yoco-text-muted)">{profile.subtitle}</p>
            </div>
            <ChevronUpIcon className="h-4 w-4 shrink-0 text-(--yoco-text-muted)" />
          </div>

          <div className="border-b border-(--yoco-border-subtle) p-2">
            <ThemeToggle className="w-full justify-start border-0 bg-transparent shadow-none hover:bg-[#674D9F]/10" />
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left font-medium text-rose-600 transition hover:bg-rose-500/10"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0 text-rose-600" />
            Log out
          </button>
        </div>
      )}

      {/* Profile trigger (bottom of sidebar) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition hover:bg-[#674D9F]/10"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#674D9F] text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-(--yoco-text)">{profile.name}</p>
          <p className="truncate text-xs text-(--yoco-text-muted)">{profile.subtitle}</p>
        </div>
        <ChevronUpIcon
          className={`h-4 w-4 shrink-0 text-(--yoco-text-muted) transition-transform ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>
    </div>
  )
}
