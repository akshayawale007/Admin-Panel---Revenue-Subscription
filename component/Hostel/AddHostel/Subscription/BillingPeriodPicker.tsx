"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import dayjs, { type Dayjs } from "dayjs"
import Button from "@/component/Common/Button/Button"
import { billingCycleEndDate, billingCycleLabel, formatDate, matchBillingCycle } from "@/lib/revenue/utils"
import type { BillingCycle } from "@/lib/revenue/types"

const BILLING_CYCLES: BillingCycle[] = ["QUARTERLY", "SEMIANNUAL", "ANNUAL"]

type Props = {
  start: string
  end: string
  cycle?: BillingCycle | ""
  lockedDurationDays?: number
  showCyclePresets?: boolean
  disabled?: boolean
  onChange: (start: string, end: string, cycle?: BillingCycle | "") => void
}

function startOfGrid(month: Dayjs) {
  const first = month.startOf("month")
  return first.subtract(first.day(), "day")
}

export default function BillingPeriodPicker({
  start,
  end,
  cycle: _cycle = "",
  lockedDurationDays,
  showCyclePresets,
  disabled,
  onChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const [cursor, setCursor] = useState(() => (dayjs(start).isValid() ? dayjs(start).startOf("month") : dayjs().startOf("month")))
  const [draftStart, setDraftStart] = useState<string | null>(null)
  const [draftEnd, setDraftEnd] = useState<string | null>(null)

  const presets = showCyclePresets ?? !lockedDurationDays
  const startDay = dayjs(start)
  const endDay = dayjs(end)
  const hasRange = Boolean(start && end && startDay.isValid() && endDay.isValid())
  const previewStart = draftStart ? dayjs(draftStart) : dayjs(NaN)
  const previewEnd = draftEnd ? dayjs(draftEnd) : null
  const triggerLabel = hasRange ? `${formatDate(start)} – ${formatDate(end)}` : "Select billing period"

  const closeWithoutSave = () => {
    setOpen(false)
    setDraftStart(null)
    setDraftEnd(null)
  }

  const placePanel = () => {
    const trigger = rootRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = 320
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    const panelHeight = panelRef.current?.offsetHeight || 420
    const gap = 8
    const above = rect.top - panelHeight - gap
    const below = rect.bottom + gap
    const fitsAbove = above >= 8
    const fitsBelow = below + panelHeight <= window.innerHeight - 8
    const top = fitsAbove || !fitsBelow ? Math.max(8, above) : below
    setCoords({ top, left })
  }

  useEffect(() => {
    if (!open) return
    setCursor(dayjs(start).isValid() ? dayjs(start).startOf("month") : dayjs().startOf("month"))
    setDraftStart(startDay.isValid() && start ? start : null)
    setDraftEnd(endDay.isValid() && end ? end : null)
  }, [open, start, end])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }
    placePanel()
  }, [open, draftStart, draftEnd])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      closeWithoutSave()
    }
    const onReposition = () => placePanel()
    document.addEventListener("mousedown", onDoc)
    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open])

  const cells = useMemo(() => {
    const origin = startOfGrid(cursor)
    return Array.from({ length: 42 }, (_, i) => origin.add(i, "day"))
  }, [cursor])

  const save = () => {
    if (!draftStart) return
    if (lockedDurationDays) {
      onChange(draftStart, dayjs(draftStart).add(lockedDurationDays, "day").format("YYYY-MM-DD"), "")
      closeWithoutSave()
      return
    }
    if (!draftEnd || !dayjs(draftEnd).isAfter(dayjs(draftStart), "day")) return
    onChange(draftStart, draftEnd, matchBillingCycle(draftStart, draftEnd))
    closeWithoutSave()
  }

  const pick = (day: Dayjs) => {
    const value = day.format("YYYY-MM-DD")
    if (lockedDurationDays) {
      setDraftStart(value)
      setDraftEnd(day.add(lockedDurationDays, "day").format("YYYY-MM-DD"))
      return
    }
    if (!draftStart || draftEnd) {
      setDraftStart(value)
      setDraftEnd(null)
      return
    }
    if (dayjs(value).isBefore(dayjs(draftStart), "day")) {
      setDraftStart(value)
      return
    }
    if (dayjs(value).isSame(dayjs(draftStart), "day")) return
    setDraftEnd(value)
  }

  const applyCycle = (nextCycle: BillingCycle) => {
    if (!draftStart) return
    setDraftEnd(billingCycleEndDate(draftStart, nextCycle))
  }

  const tone = (day: Dayjs) => {
    const inMonth = day.month() === cursor.month()
    const isStart = previewStart.isValid() && day.isSame(previewStart, "day")
    const isEnd = Boolean(previewEnd?.isValid() && day.isSame(previewEnd, "day"))
    const inRange =
      Boolean(previewEnd?.isValid()) &&
      ((day.isAfter(previewStart, "day") && day.isBefore(previewEnd, "day")) || isStart || isEnd)

    if (isStart || isEnd) return "bg-(--yoco-primary) text-white"
    if (inRange) return "bg-[#EDE8F4] text-(--yoco-primary)"
    if (!inMonth) return "text-(--yoco-text-muted) opacity-40"
    return "text-(--yoco-text) hover:bg-(--yoco-surface-muted)"
  }

  const canSave = Boolean(
    draftStart && (lockedDurationDays || (draftEnd && dayjs(draftEnd).isAfter(dayjs(draftStart), "day")))
  )
  const draftCycle = draftStart && draftEnd ? matchBillingCycle(draftStart, draftEnd) : ""

  const panel =
    open && typeof document !== "undefined" ? (
      createPortal(
        <div
          ref={panelRef}
          className="fixed z-[400] w-80 rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) p-3 shadow-xl"
          style={{
            top: coords?.top ?? 0,
            left: coords?.left ?? 0,
            visibility: coords ? "visible" : "hidden",
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-(--yoco-text-muted) hover:bg-(--yoco-surface-muted)"
              onClick={() => setCursor((m) => m.subtract(1, "month"))}
            >
              ‹
            </button>
            <p className="text-sm font-semibold">{cursor.format("MMMM YYYY")}</p>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-(--yoco-text-muted) hover:bg-(--yoco-surface-muted)"
              onClick={() => setCursor((m) => m.add(1, "month"))}
            >
              ›
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day) => (
              <button
                key={day.format("YYYY-MM-DD")}
                type="button"
                onClick={() => pick(day)}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${tone(day)}`}
              >
                {day.date()}
              </button>
            ))}
          </div>
          {presets ? (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {BILLING_CYCLES.map((item) => {
                const selected = draftCycle === item
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!draftStart}
                    onClick={() => applyCycle(item)}
                    className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected
                        ? "border-(--yoco-primary) bg-(--yoco-row-hover)"
                        : "border-(--yoco-border-subtle) hover:border-(--yoco-border)"
                    }`}
                  >
                    {billingCycleLabel(item)}
                  </button>
                )
              })}
            </div>
          ) : null}
          <p className="mt-2 text-[11px] text-(--yoco-text-muted)">
            {lockedDurationDays
              ? "Select a start date, then Save. Renewal is 30 days later."
              : draftEnd
                ? `${formatDate(draftStart)} – ${formatDate(draftEnd)}. Save to apply.`
                : draftStart
                  ? "Now pick an end date, or use Quarterly, Semiannual, or Annual."
                  : "Pick a start date, then an end date. Save to apply."}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button title="Cancel" variant="secondary" onClick={closeWithoutSave} />
            <Button title="Save" disabled={!canSave} onClick={save} />
          </div>
        </div>,
        document.body
      )
    ) : null

  return (
    <div ref={rootRef} className="w-fit max-w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
        }}
        className="yoco-form-input-field !inline-flex !w-fit max-w-full items-center gap-2 px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="whitespace-nowrap text-sm">{triggerLabel}</span>
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-(--yoco-text-muted)" aria-hidden>
          <path
            fill="currentColor"
            d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm10 7H4v7h12V9Z"
          />
        </svg>
      </button>
      {panel}
    </div>
  )
}
