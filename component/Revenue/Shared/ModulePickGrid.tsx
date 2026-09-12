"use client"

import type { ModuleCatalogItem } from "@/lib/revenue/types"

export default function ModulePickGrid({
  items,
  selected,
  onToggle,
  lockedKeys = [],
}: {
  items: ModuleCatalogItem[]
  selected: string[]
  onToggle: (key: string) => void
  lockedKeys?: string[]
}) {
  const locked = new Set(lockedKeys)
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {items.map((mod) => {
        const on = selected.includes(mod.key)
        const isLocked = locked.has(mod.key)
        return (
          <button
            key={mod.key}
            type="button"
            disabled={isLocked && on}
            onClick={() => {
              if (isLocked && on) return
              onToggle(mod.key)
            }}
            className={`rounded-md border px-2 py-1.5 text-left ${
              on
                ? "border-(--yoco-primary) bg-(--yoco-row-hover) ring-1 ring-(--yoco-primary)"
                : "border-(--yoco-border-subtle) hover:border-(--yoco-border)"
            } ${isLocked && on ? "cursor-not-allowed" : ""}`}
          >
            <p className="text-[11px] font-semibold leading-tight">
              {mod.name}
              {isLocked && on ? (
                <span className="ml-1 text-[8px] font-medium uppercase tracking-wide text-(--yoco-text-muted)">
                  Included
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-(--yoco-text-muted)">{mod.description}</p>
          </button>
        )
      })}
    </div>
  )
}
