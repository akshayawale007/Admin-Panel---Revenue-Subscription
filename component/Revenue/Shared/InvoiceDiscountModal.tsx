"use client"

import { useEffect, useMemo, useState } from "react"
import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { formatINR, gstRatesFromSettings, invoiceGrossAmount, invoiceTotalsFromGross } from "@/lib/revenue/utils"
import type { HostelSubscription, Invoice } from "@/lib/revenue/types"

export default function InvoiceDiscountModal({
  open,
  setOpen,
  hostel,
  invoice,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  hostel: HostelSubscription
  invoice: Invoice | null
}) {
  const { applyInvoiceDiscount, settings } = useRevenue()
  const [value, setValue] = useState("")

  useEffect(() => {
    if (!open || !invoice) return
    setValue(invoice.discountType === "percent" && invoice.discountValue ? String(invoice.discountValue) : "")
  }, [open, invoice])

  const gross = invoice ? invoiceGrossAmount(invoice) : 0
  const parsed = Number(value) || 0
  const hasDiscount = parsed > 0
  const totals = useMemo(
    () =>
      invoice
        ? invoiceTotalsFromGross({
            gross,
            discountType: hasDiscount ? "percent" : undefined,
            discountValue: hasDiscount ? parsed : undefined,
            sameState: true,
            gstRate: settings.gstRate,
            cgstRate: settings.cgstRate,
            sgstRate: settings.sgstRate,
            proRatedAdjustment: invoice.proRatedAdjustment,
          })
        : null,
    [invoice, gross, hasDiscount, parsed, settings]
  )
  const { cgstRate, sgstRate } = gstRatesFromSettings(settings)
  const invalid = parsed > 100
  const locked = invoice?.status !== "unpaid"
  const canSave = Boolean(invoice) && !locked && !invalid

  if (!invoice || !totals) return null

  return (
    <Modal open={open} setOpen={setOpen} width="md">
      <div className="p-5">
        <p className="yoco-form-title text-base">Discount · {invoice.invoiceNo}</p>
        <p className="mt-1 text-sm text-(--yoco-text-muted)">
          Percentage is taken off {formatINR(gross)} before CGST and SGST. Leave blank or enter 0 to remove it.
          {locked ? " Mark this invoice unpaid before editing." : ""}
        </p>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Discount %</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            disabled={locked}
            className="yoco-input px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        {invalid ? <p className="mt-2 text-xs font-semibold text-rose-500">Percentage cannot exceed 100.</p> : null}

        <div className="mt-4 rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-muted) px-3 py-2 text-sm">
          <p>Amount {formatINR(totals.gross)}</p>
          <p className="text-(--yoco-text-muted)">
            CGST {cgstRate}% {formatINR(totals.cgst)} · SGST {sgstRate}% {formatINR(totals.sgst)}
          </p>
          {totals.discountOff > 0 ? <p>Discount −{formatINR(totals.discountOff)}</p> : <p>Discount —</p>}
          <p className="font-semibold">Total {formatINR(totals.total)}</p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button title="Cancel" variant="secondary" onClick={() => setOpen(false)} />
          <Button
            title="Save discount"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              applyInvoiceDiscount(
                hostel.hostelId,
                invoice.id,
                hasDiscount ? { type: "percent", value: parsed } : { type: "none" }
              )
              setOpen(false)
            }}
          />
        </div>
      </div>
    </Modal>
  )
}
