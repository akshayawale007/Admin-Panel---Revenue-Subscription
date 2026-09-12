"use client"

import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"
import { toast } from "react-toastify"
import type { HostelSubscription, Invoice, RevenueSettings, RevenueViewerRole } from "@/lib/revenue/types"
import {
  formatDate,
  formatDateTime,
  formatINR,
  gstRatesFromSettings,
  invoicePeriodCycleLabel,
  invoicePlanDisplay,
  invoiceTotalsFromGross,
  moduleByKey,
  planLabel,
  statusLabel,
} from "@/lib/revenue/utils"

type Props = {
  open: boolean
  setOpen: (v: boolean) => void
  invoice: Invoice | null
  hostel: HostelSubscription | null
  settings: RevenueSettings
  onConfirmSend?: () => void
  viewerRole?: RevenueViewerRole
}

export default function InvoicePreviewModal({
  open,
  setOpen,
  invoice,
  hostel,
  settings,
  onConfirmSend,
  viewerRole = "admin",
}: Props) {
  if (!invoice || !hostel) return null

  const totals = invoiceTotalsFromGross({
    gross: invoice.grossAmount ?? invoice.amount,
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
    sameState: invoice.sameState,
    gstRate: settings.gstRate,
    cgstRate: settings.cgstRate,
    sgstRate: settings.sgstRate,
    proRatedAdjustment: invoice.proRatedAdjustment,
  })
  const gst = totals
  const modules = invoice.modules.map((k) => moduleByKey(k)?.name ?? k).join(", ")
  const { cgstRate, sgstRate, gstRate } = gstRatesFromSettings(settings)

  return (
    <Modal open={open} setOpen={setOpen} width="3xl" height="90vh">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-[210mm] border border-(--yoco-border-subtle) bg-white p-8 text-[#3d2d5c] shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-(--yoco-border-subtle) pb-4">
            <div>
              {settings.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoDataUrl} alt="logo" className="mb-2 h-10 object-contain" />
              ) : null}
              <p className="text-lg font-bold">{settings.companyName}</p>
              <p className="text-xs text-(--yoco-text-muted)">GSTIN: {settings.gstin}</p>
              <p className="text-xs text-(--yoco-text-muted)">{settings.companyAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[#674D9F]">INVOICE</p>
              <p className="text-sm font-semibold">{invoice.invoiceNo}</p>
              <p className="text-xs">Generated {formatDate(invoice.dateGenerated)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Bill to</p>
              <p className="font-bold">{hostel.name}</p>
              <p>
                {hostel.city}, {hostel.state}
              </p>
              <p>{hostel.hostelCode}</p>
              <p>
                {hostel.adminName} · {hostel.adminPhone}
              </p>
            </div>
            <div className="text-right">
              <p>Due date: {formatDate(invoice.dueDate)}</p>
              <p>Status: {statusLabel(invoice.status)}</p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <tbody>
              <Row
                label="Billing cycle"
                value={invoicePeriodCycleLabel(invoice.billingPeriodStart, invoice.billingPeriodEnd)}
              />
              <Row label="Plan" value={invoicePlanDisplay(invoice)} />
              {invoice.invoiceType === "mid_cycle_student_upgrade" && invoice.invoiceBreakdown ? (
                <>
                  <Row label="Original seats" value={String(invoice.invoiceBreakdown.originalStudentCount ?? "—")} />
                  <Row label="Seats added" value={String(invoice.invoiceBreakdown.addedStudentCount ?? invoice.students)} />
                  <Row
                    label="New billed total"
                    value={String(invoice.invoiceBreakdown.billedStudentCount ?? "—")}
                  />
                  <Row label="Rate per added seat" value={`${formatINR(invoice.invoiceBreakdown.newRate ?? invoice.rate)}/seat/month`} />
                  <Row
                    label="Applies only through original plan period"
                    value={`${formatDate(invoice.billingPeriodEnd)} · ${invoice.invoiceBreakdown.monthsRemaining ?? "—"} of ${invoice.invoiceBreakdown.periodMonths ?? "—"} months`}
                  />
                  <Row label="Charge for added seats" value={formatINR(invoice.invoiceBreakdown.charge ?? invoice.amount)} />
                </>
              ) : invoice.invoiceType === "mid_cycle_plan_upgrade" && invoice.invoiceBreakdown ? (
                <>
                  <Row
                    label="Previous plan"
                    value={`${planLabel(invoice.invoiceBreakdown.previousPlan)} · ${formatINR(invoice.invoiceBreakdown.previousRate ?? 0)}/seat/month`}
                  />
                  <Row
                    label="New plan"
                    value={`${planLabel(invoice.invoiceBreakdown.newPlan ?? invoice.plan)} · ${formatINR(invoice.invoiceBreakdown.newRate ?? invoice.rate)}/seat/month`}
                  />
                  <Row
                    label="Rate difference"
                    value={`${formatINR((invoice.invoiceBreakdown.newRate ?? invoice.rate) - (invoice.invoiceBreakdown.previousRate ?? 0))}/seat/month`}
                  />
                  <Row
                    label="Seats this difference applies to"
                    value={String(invoice.invoiceBreakdown.billedStudentCount ?? invoice.students)}
                  />
                  <Row
                    label="Remaining months"
                    value={`${invoice.invoiceBreakdown.monthsRemaining ?? "—"} of ${invoice.invoiceBreakdown.periodMonths ?? "—"}`}
                  />
                  <Row label="Difference charge" value={formatINR(invoice.invoiceBreakdown.charge ?? invoice.amount)} />
                </>
              ) : (
                <>
                  <Row label="Number of seats billed" value={String(invoice.students)} />
                  <Row label="Rate per seat per month" value={`${formatINR(invoice.rate)}/seat/month`} />
                </>
              )}
              <Row
                label="Billing period"
                value={`${formatDate(invoice.billingPeriodStart)} – ${formatDate(invoice.billingPeriodEnd)}`}
              />
              <Row label="Active modules" value={modules || "—"} />
              {invoice.notes ? <Row label="Description" value={invoice.notes} /> : null}
              {totals.discountOff > 0 ? (
                <>
                  <Row label="Gross before discount" value={formatINR(totals.gross)} />
                  <Row
                    label={
                      invoice.discountType === "percent"
                        ? `Discount (${invoice.discountValue}%)`
                        : "Discount (flat)"
                    }
                    value={`−${formatINR(totals.discountOff)}`}
                  />
                  {invoice.discountReason ? <Row label="Discount reason" value={invoice.discountReason} /> : null}
                  <Row label="Taxable amount" value={formatINR(totals.taxable)} />
                </>
              ) : (
                <Row label="Subtotal before GST" value={formatINR(invoice.amount)} />
              )}
              {invoice.sameState ? (
                <>
                  <Row label={`CGST (${cgstRate}%)`} value={formatINR(gst.cgst)} />
                  <Row label={`SGST (${sgstRate}%)`} value={formatINR(gst.sgst)} />
                </>
              ) : (
                <Row label={`IGST (${gstRate}%)`} value={formatINR(gst.igst)} />
              )}
              {invoice.proRatedAdjustment ? (
                <Row
                  label="Pro-rated adjustment"
                  value={`${invoice.proRatedAdjustment > 0 ? "+" : ""}${formatINR(invoice.proRatedAdjustment)}`}
                />
              ) : null}
              <tr className="border-t border-(--yoco-border-subtle) font-bold">
                <td className="py-2">Total amount due</td>
                <td className="py-2 text-right">{formatINR(gst.total)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 border-t border-(--yoco-border-subtle) pt-3 text-xs text-(--yoco-text-muted)">
            Invoice {invoice.invoiceNo} · Generated {formatDate(invoice.dateGenerated)}
          </div>
        </div>

        {viewerRole === "admin" && invoice.invoiceHistory?.length ? (
          <div className="mx-auto mt-4 max-w-[210mm] rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) p-4">
            <p className="text-sm font-semibold">Admin history</p>
            <div className="mt-2 flex flex-col gap-2">
              {invoice.invoiceHistory.map((event) => (
                <div key={event.id} className="text-sm">
                  <p className="font-semibold">
                    {event.action} · {event.by}
                  </p>
                  <p className="text-xs text-(--yoco-text-muted)">{formatDateTime(event.timestamp)}</p>
                  {event.note ? <p className="mt-1 text-(--yoco-text-muted)">{event.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          {viewerRole === "admin" && onConfirmSend ? (
            <Button title="Confirm & send" onClick={onConfirmSend} />
          ) : null}
          <Button
            title="Download PDF"
            onClick={() => toast.success("PDF downloaded", { autoClose: 3000 })}
          />
          <Button title="Close" variant="secondary" onClick={() => setOpen(false)} />
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-(--yoco-border-subtle)/60">
      <td className="py-2 text-(--yoco-text-muted)">{label}</td>
      <td className="py-2 text-right font-semibold">{value}</td>
    </tr>
  )
}
