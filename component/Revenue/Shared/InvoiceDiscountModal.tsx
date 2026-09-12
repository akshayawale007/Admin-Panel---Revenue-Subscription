"use client"

import { useEffect, useMemo, useState } from "react"
import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"
import InvoiceDiscountFields, { type DiscountMode } from "@/component/Revenue/Shared/InvoiceDiscountFields"
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
  const [mode, setMode] = useState<DiscountMode>("none")
  const [value, setValue] = useState("")
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (!open || !invoice) return
    setMode(invoice.discountType ?? "none")
    setValue(invoice.discountValue != null ? String(invoice.discountValue) : "")
    setReason(invoice.discountReason ?? "")
  }, [open, invoice])

  const gross = invoice ? invoiceGrossAmount(invoice) : 0
  const parsed = Number(value) || 0
  const hasDiscount = mode !== "none" && parsed > 0
  const totals = useMemo(
    () =>
      invoice
        ? invoiceTotalsFromGross({
            gross,
            discountType: hasDiscount ? mode : undefined,
            discountValue: hasDiscount ? parsed : undefined,
            sameState: invoice.sameState,
            gstRate: settings.gstRate,
            cgstRate: settings.cgstRate,
            sgstRate: settings.sgstRate,
            proRatedAdjustment: invoice.proRatedAdjustment,
          })
        : null,
    [invoice, gross, hasDiscount, mode, parsed, settings]
  )
  const { gstRate, cgstRate, sgstRate } = gstRatesFromSettings(settings)
  const invalid =
    hasDiscount && (mode === "percent" ? parsed > 100 : parsed > gross)
  const canSave = Boolean(invoice) && invoice?.status === "unpaid" && !invalid && (mode === "none" || parsed > 0)

  if (!invoice) return null

  return (
    <Modal open={open} setOpen={setOpen} width="md">
      <div className="p-5">
        <p className="yoco-form-title text-base">Discount · {invoice.invoiceNo}</p>
        <p className="mt-1 text-sm text-(--yoco-text-muted)">
          Applied before GST on unpaid invoices only. Gross taxable amount is {formatINR(gross)}.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <InvoiceDiscountFields
            mode={mode}
            value={value}
            reason={reason}
            onModeChange={setMode}
            onValueChange={setValue}
            onReasonChange={setReason}
          />
          {invalid ? (
            <p className="text-xs font-semibold text-rose-500">
              {mode === "percent" ? "Percentage cannot exceed 100." : "Flat discount cannot exceed the gross amount."}
            </p>
          ) : null}
          {totals ? (
            <div className="rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-muted) px-3 py-2 text-sm">
              {totals.discountOff > 0 ? (
                <p>
                  Discount {formatINR(totals.discountOff)} · Taxable {formatINR(totals.taxable)}
                </p>
              ) : (
                <p>Taxable {formatINR(totals.taxable)}</p>
              )}
              <p className="text-(--yoco-text-muted)">
                {invoice.sameState
                  ? `CGST ${cgstRate}% ${formatINR(totals.cgst)} · SGST ${sgstRate}% ${formatINR(totals.sgst)}`
                  : `IGST ${gstRate}% ${formatINR(totals.igst)}`}
              </p>
              <p className="font-semibold">Total {formatINR(totals.total)}</p>
            </div>
          ) : null}
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
                mode === "none" || !hasDiscount
                  ? { type: "none" }
                  : { type: mode, value: parsed, reason: reason.trim() || undefined }
              )
              setOpen(false)
            }}
          />
        </div>
      </div>
    </Modal>
  )
}
