"use client"

import YocoSelect from "@/component/Common/Select/YocoSelect"
import type { InvoiceDiscountType } from "@/lib/revenue/types"

export type DiscountMode = "none" | InvoiceDiscountType

export default function InvoiceDiscountFields({
  mode,
  value,
  reason,
  onModeChange,
  onValueChange,
  onReasonChange,
}: {
  mode: DiscountMode
  value: string
  reason: string
  onModeChange: (mode: DiscountMode) => void
  onValueChange: (value: string) => void
  onReasonChange: (reason: string) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Discount</span>
        <YocoSelect
          fullWidth
          ariaLabel="Discount type"
          value={mode}
          onChange={(next) => onModeChange(next as DiscountMode)}
          options={[
            { value: "none", label: "No discount" },
            { value: "flat", label: "Flat (₹)" },
            { value: "percent", label: "Percentage (%)" },
          ]}
        />
      </label>
      {mode !== "none" ? (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
              {mode === "percent" ? "Discount %" : "Discount amount (₹)"}
            </span>
            <input
              type="number"
              min={0}
              max={mode === "percent" ? 100 : undefined}
              step={mode === "percent" ? 0.01 : 1}
              className="yoco-input px-3 py-2"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
              Discount reason
            </span>
            <input
              type="text"
              className="yoco-input px-3 py-2"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </>
      ) : null}
    </div>
  )
}
