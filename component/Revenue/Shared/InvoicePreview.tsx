"use client"

import type { ReactNode } from "react"

export type InvoiceLine = {
  label: string
  value: string
  hint?: string
  emphasis?: boolean
}

export type InvoiceGroup = {
  title: string
  lines: InvoiceLine[]
}

export type InvoiceHighlight = {
  label: string
  value: string
  hint?: string
  tone?: "rate" | "total"
}

export default function InvoicePreview({
  title,
  value,
  meta,
  badge,
  highlights,
  groups,
}: {
  title: string
  value?: string
  meta?: string
  badge?: ReactNode
  highlights: InvoiceHighlight[]
  groups: InvoiceGroup[]
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated)">
      <div className="border-b border-(--yoco-border-subtle) px-4 py-3">
        <h3 className="text-base font-semibold text-(--yoco-text)">Invoice preview</h3>
      </div>
      <div
        className={`grid gap-px border-b border-(--yoco-border-subtle) bg-(--yoco-border-subtle) ${
          highlights.length >= 2 ? "sm:grid-cols-3" : highlights.length === 1 ? "sm:grid-cols-2" : ""
        }`}
      >
        <div className="bg-(--yoco-surface-elevated) px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {badge ?? <p className="text-xl font-semibold tracking-tight text-(--yoco-text)">{value ?? title}</p>}
          </div>
          {meta ? <p className="mt-0.5 text-[11px] text-(--yoco-text-muted)">{meta}</p> : null}
        </div>
        {highlights.map((item) => (
          <div
            key={item.label}
            className={`px-4 py-3.5 ${
              item.tone === "total" ? "bg-[#F4F0FA]" : "bg-(--yoco-surface-elevated)"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">{item.label}</p>
            <p
              className={`mt-1 font-semibold tracking-tight ${
                item.tone === "total" ? "text-xl text-(--yoco-primary)" : "text-xl text-(--yoco-text)"
              }`}
            >
              {item.value}
              {item.tone === "rate" ? (
                <span className="ml-1.5 text-xs font-medium text-(--yoco-text-muted)">/ seat / month</span>
              ) : null}
            </p>
            {item.hint ? <p className="mt-0.5 text-[11px] text-(--yoco-text-muted)">{item.hint}</p> : null}
          </div>
        ))}
      </div>

      <div className="divide-y divide-(--yoco-border-subtle)">
        {groups.map((group) => (
          <div key={group.title} className="px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">{group.title}</p>
            <ul className="space-y-1.5">
              {group.lines.map((line) => (
                <li
                  key={`${group.title}-${line.label}`}
                  className={`flex items-baseline justify-between gap-4 text-sm ${
                    line.emphasis ? "border-t border-(--yoco-border-subtle) pt-2" : ""
                  }`}
                >
                  <span className={line.emphasis ? "font-semibold text-(--yoco-text)" : "text-(--yoco-text-muted)"}>
                    {line.label}
                    {line.hint ? (
                      <span className="mt-0.5 block text-[11px] font-normal text-(--yoco-text-muted)">{line.hint}</span>
                    ) : null}
                  </span>
                  <span className={`shrink-0 tabular-nums ${line.emphasis ? "font-semibold text-(--yoco-text)" : "font-medium text-(--yoco-text)"}`}>
                    {line.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
