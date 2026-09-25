"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDownIcon } from "@heroicons/react/24/outline"

export type YocoSelectOption = {
  value: string
  label: string
}

type YocoSelectProps = {
  value: string
  onChange: (value: string) => void
  options: YocoSelectOption[]
  ariaLabel?: string
  placeholder?: string
  fullWidth?: boolean
  narrow?: boolean
  className?: string
}

export default function YocoSelect({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = "Select",
  fullWidth = false,
  narrow = false,
  className = "",
}: YocoSelectProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const place = () => {
      const button = ref.current?.querySelector("button")
      if (!button) return
      const rect = button.getBoundingClientRect()
      const menuHeight = Math.min(240, options.length * 32 + 8)
      const below = rect.bottom + 4
      const top = below + menuHeight > window.innerHeight && rect.top > menuHeight ? rect.top - menuHeight - 4 : below
      setPos({ top, left: rect.left, width: rect.width })
    }
    place()
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", close)
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      document.removeEventListener("mousedown", close)
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open, options.length])

  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-flex"} ${className}`} ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-(--yoco-input-bg) px-3 text-sm font-semibold text-(--yoco-text) shadow-sm transition-colors ${
          fullWidth ? "w-full" : narrow ? "min-w-18" : "min-w-36 max-w-54"
        } ${
          open
            ? "border-(--yoco-primary)"
            : "border-(--yoco-input-border) hover:border-(--yoco-primary)"
        }`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`size-4 shrink-0 text-(--yoco-text-muted) transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
        <ul
          ref={menuRef}
          role="listbox"
          className="fixed z-[400] max-h-60 overflow-auto rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) py-1 shadow-lg"
          style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 144) }}
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`block w-full cursor-pointer px-3 py-1.5 text-left text-sm font-medium ${
                    active
                      ? "bg-[#674D9F] text-white"
                      : "text-(--yoco-text) hover:bg-(--yoco-row-hover)"
                  }`}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>,
        document.body
      )
        : null}
    </div>
  )
}
