"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"

export type TableAction = {
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

export default function TableActionMenu({
  actions,
  buttonLabel = "Actions",
}: {
  actions: TableAction[]
  buttonLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        className={`inline-flex w-auto shrink-0 cursor-pointer items-center gap-1 rounded-lg border bg-(--yoco-input-bg) px-2.5 py-1.5 text-xs font-semibold text-(--yoco-text) shadow-sm transition-colors ${
          open ? "border-(--yoco-primary)" : "border-(--yoco-input-border) hover:border-(--yoco-primary)"
        }`}
        onClick={(e) => {
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
          setOpen((v) => !v)
        }}
      >
        {buttonLabel}
        <ChevronDownIcon className={`size-3.5 text-(--yoco-text-muted) transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          className="fixed z-50 w-max min-w-36 overflow-hidden rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) py-1 shadow-lg"
          style={{ top: pos.top, right: pos.right }}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              className={`block w-full cursor-pointer px-3 py-1.5 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                action.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-(--yoco-text) hover:bg-(--yoco-row-hover)"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                action.onClick()
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
