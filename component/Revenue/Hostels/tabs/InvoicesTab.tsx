"use client"

import { useEffect, useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { EyeIcon } from "@heroicons/react/24/outline"
import CommonTable from "@/component/Common/Table/Table"
import Button from "@/component/Common/Button/Button"
import Modal from "@/component/Common/Modal/Modal"
import ConfirmDialog from "@/component/Revenue/Shared/ConfirmDialog"
import ComingSoonDialog from "@/component/Revenue/Shared/ComingSoonDialog"
import TableActionMenu from "@/component/Revenue/Shared/TableActionMenu"
import InvoicePreviewModal from "@/component/Revenue/Shared/InvoicePreviewModal"
import ManualInvoiceModal from "@/component/Revenue/Shared/ManualInvoiceModal"
import InvoiceDiscountModal from "@/component/Revenue/Shared/InvoiceDiscountModal"
import StatusBadge from "@/component/Revenue/Shared/StatusBadge"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { INVOICE_ACTOR } from "@/lib/revenue/constants"
import {
  defaultInvoiceDueDate,
  formatDate,
  formatINR,
  invoicePeriodCycleLabel,
  invoiceTotalsFromGross,
} from "@/lib/revenue/utils"
import { toast } from "react-toastify"
import type { HostelSubscription, Invoice, RevenueViewerRole } from "@/lib/revenue/types"

export default function InvoicesTab({
  hostel,
  viewerRole = "admin",
}: {
  hostel: HostelSubscription
  viewerRole?: RevenueViewerRole
}) {
  const { updateHostel, addAudit, settings } = useRevenue()
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null)
  const [paidTarget, setPaidTarget] = useState<Invoice | null>(null)
  const [unpaidTarget, setUnpaidTarget] = useState<Invoice | null>(null)
  const [dueTarget, setDueTarget] = useState<Invoice | null>(null)
  const [dueDateValue, setDueDateValue] = useState("")
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [discountTarget, setDiscountTarget] = useState<Invoice | null>(null)
  const isWarden = viewerRole === "warden"

  const rows = hostel.invoices.map((i) => ({ ...i, _id: i.id }))

  const applyInvoiceAction = (invoice: Invoice, actionLabel: string, patch: Partial<Invoice>, note?: string) => {
    const historyEvent = {
      id: `ih-${Date.now()}`,
      action: actionLabel,
      note,
      timestamp: new Date().toISOString(),
      by: INVOICE_ACTOR,
    }
    updateHostel(hostel.hostelId, {
      invoices: hostel.invoices.map((i) =>
        i.id === invoice.id
          ? { ...i, ...patch, invoiceHistory: [historyEvent, ...(i.invoiceHistory ?? [])] }
          : i
      ),
    })
    addAudit(
      hostel.hostelId,
      note ? `Invoice ${invoice.invoiceNo} ${actionLabel} — ${note}` : `Invoice ${invoice.invoiceNo} ${actionLabel}`,
      INVOICE_ACTOR
    )
  }

  useEffect(() => {
    if (!dueTarget) return
    setDueDateValue(dueTarget.dueDate || defaultInvoiceDueDate(dueTarget.dateGenerated))
  }, [dueTarget])

  const columns = useMemo<ColumnDef<Invoice & { _id: string }>[]>(
    () => [
      { accessorKey: "invoiceNo", header: "Invoice No.", size: 96 },
      {
        header: "Billing Cycle",
        size: 112,
        cell: ({ row }) => (
          <span className="block whitespace-normal text-xs leading-snug">
            {invoicePeriodCycleLabel(row.original.billingPeriodStart, row.original.billingPeriodEnd)}
          </span>
        ),
      },
      {
        header: "Billing Period",
        size: 118,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 text-xs leading-tight">
            <p>
              <span className="mr-1 text-(--yoco-text-muted)">Start</span>
              {formatDate(row.original.billingPeriodStart)}
            </p>
            <p>
              <span className="mr-1 text-(--yoco-text-muted)">End</span>
              {formatDate(row.original.billingPeriodEnd)}
            </p>
          </div>
        ),
      },
      {
        header: "Seats",
        size: 64,
        cell: ({ row }) => {
          const invoice = row.original
          if (invoice.invoiceType === "mid_cycle_student_upgrade") {
            return `+${invoice.invoiceBreakdown?.addedStudentCount ?? invoice.students} added`
          }
          if (invoice.invoiceType === "mid_cycle_plan_upgrade") {
            return `${invoice.invoiceBreakdown?.billedStudentCount ?? invoice.students} billed`
          }
          return invoice.students
        },
      },
      { header: "Total", size: 80, cell: ({ row }) => formatINR(row.original.total) },
      { header: "Status", size: 76, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Generated On", size: 96, cell: ({ row }) => formatDate(row.original.dateGenerated) },
      {
        id: "actions",
        header: "Actions",
        size: 148,
        minSize: 140,
        meta: { align: "center" },
        cell: ({ row }) => {
          const invoice = row.original
          return (
            <div className="flex flex-nowrap items-center justify-center gap-2">
              <TableActionMenu
                actions={
                  isWarden
                    ? [{ label: "Download PDF", onClick: () => toast.success("PDF downloaded", { autoClose: 3000 }) }]
                    : [
                        { label: "Download PDF", onClick: () => toast.success("PDF downloaded", { autoClose: 3000 }) },
                        {
                          label: "Set due date",
                          disabled: invoice.status === "voided",
                          onClick: () => setDueTarget(invoice),
                        },
                        {
                          label: "Mark as paid",
                          disabled: invoice.status === "paid",
                          onClick: () => setPaidTarget(invoice),
                        },
                        {
                          label: "Mark as unpaid",
                          disabled: invoice.status === "unpaid",
                          onClick: () => setUnpaidTarget(invoice),
                        },
                        {
                          label: invoice.discountType ? "Edit discount" : "Add discount",
                          disabled: invoice.status !== "unpaid",
                          onClick: () => setDiscountTarget(invoice),
                        },
                        { label: "Void", danger: true, onClick: () => setVoidTarget(invoice) },
                        { label: "Notify", onClick: () => setNotifyOpen(true) },
                      ]
                }
              />
              <button
                type="button"
                aria-label="View invoice"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--yoco-input-border) bg-(--yoco-input-bg) text-(--yoco-text) shadow-sm hover:border-(--yoco-primary)"
                onClick={() => setPreview(invoice)}
              >
                <EyeIcon className="size-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [hostel.invoices, hostel.hostelId, isWarden]
  )

  return (
    <>
      <CommonTable
        showCheckbox={false}
        showSrNo={false}
        showExport={false}
        data={rows}
        extraColumn={columns}
        overflowX
        paginationShow
        tableHeight="min(520px, calc(100vh - 280px))"
        renderSubRow={(invoice) => {
          const half = Math.round(invoice.gst / 2)
          const gstSplit = invoice.sameState
            ? `CGST ${formatINR(half)} · SGST ${formatINR(invoice.gst - half)}`
            : `IGST ${formatINR(invoice.gst)}`
          const breakdown = invoice.invoiceBreakdown
          const discountTotals =
            invoice.discountType && invoice.discountValue
              ? invoiceTotalsFromGross({
                  gross: invoice.grossAmount ?? invoice.amount,
                  discountType: invoice.discountType,
                  discountValue: invoice.discountValue,
                  sameState: invoice.sameState,
                })
              : null
          return (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-(--yoco-text-muted)">
              {invoice.invoiceType === "mid_cycle_student_upgrade" && breakdown ? (
                <>
                  <span>
                    <span className="font-semibold text-(--yoco-text)">Original</span> {breakdown.originalStudentCount}
                  </span>
                  <span>
                    <span className="font-semibold text-(--yoco-text)">Added</span> {breakdown.addedStudentCount}
                  </span>
                  <span>
                    <span className="font-semibold text-(--yoco-text)">Charge</span> {formatINR(breakdown.charge ?? invoice.amount)}
                  </span>
                </>
              ) : null}
              {invoice.invoiceType === "mid_cycle_plan_upgrade" && breakdown ? (
                <>
                  <span>
                    <span className="font-semibold text-(--yoco-text)">Difference</span>{" "}
                    {formatINR((breakdown.newRate ?? 0) - (breakdown.previousRate ?? 0))}/seat
                  </span>
                  <span>
                    <span className="font-semibold text-(--yoco-text)">Applies to</span> {breakdown.billedStudentCount}
                  </span>
                  <span>
                    <span className="font-semibold text-(--yoco-text)">Charge</span> {formatINR(breakdown.charge ?? invoice.amount)}
                  </span>
                </>
              ) : null}
              <span>
                <span className="font-semibold text-(--yoco-text)">Amount</span> {formatINR(invoice.amount)}
              </span>
              {discountTotals ? (
                <span>
                  <span className="font-semibold text-(--yoco-text)">Discount</span> −
                  {formatINR(discountTotals.discountOff)}
                  {invoice.discountType === "percent" ? ` (${invoice.discountValue}%)` : ""}
                </span>
              ) : null}
              {invoice.invoiceType === "manual" && invoice.notes ? (
                <span>
                  <span className="font-semibold text-(--yoco-text)">Note</span> {invoice.notes}
                </span>
              ) : null}
              <span>
                <span className="font-semibold text-(--yoco-text)">GST</span> {formatINR(invoice.gst)}{" "}
                <span>({gstSplit})</span>
              </span>
              <span>
                <span className="font-semibold text-(--yoco-text)">Total</span> {formatINR(invoice.total)}
              </span>
            </div>
          )
        }}
      />
      {!isWarden ? (
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="fixed right-6 bottom-6 z-30 cursor-pointer rounded-full bg-(--yoco-primary) px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-(--yoco-primary-dark)"
        >
          Create invoice
        </button>
      ) : null}
      <ManualInvoiceModal open={createOpen} setOpen={setCreateOpen} hostel={hostel} />
      <InvoiceDiscountModal
        open={Boolean(discountTarget)}
        setOpen={(open) => !open && setDiscountTarget(null)}
        hostel={hostel}
        invoice={discountTarget}
      />
      <InvoicePreviewModal
        open={Boolean(preview)}
        setOpen={() => setPreview(null)}
        invoice={preview}
        hostel={hostel}
        settings={settings}
        viewerRole={viewerRole}
      />
      <ComingSoonDialog open={notifyOpen} setOpen={setNotifyOpen} />
      <Modal open={Boolean(dueTarget)} setOpen={(open) => !open && setDueTarget(null)} width="md">
        <div className="p-5">
          <p className="yoco-form-title text-base">Set due date</p>
          <p className="mt-2 text-sm text-(--yoco-text-muted)">
            One-time due date for this invoice. Default is 10 days after the generated date.
          </p>
          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Due date</span>
            <input
              type="date"
              className="yoco-input px-3 py-2"
              value={dueDateValue}
              onChange={(e) => setDueDateValue(e.target.value)}
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <Button title="Cancel" variant="secondary" onClick={() => setDueTarget(null)} />
            <Button
              title="Save due date"
              disabled={!dueDateValue}
              onClick={() => {
                if (!dueTarget || !dueDateValue) return
                applyInvoiceAction(dueTarget, "due date set", { dueDate: dueDateValue })
                setDueTarget(null)
              }}
            />
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(paidTarget)}
        setOpen={() => setPaidTarget(null)}
        title="Mark this invoice as paid?"
        confirmLabel="Mark as paid"
        noteEnabled
        onConfirm={(note) => {
          if (!paidTarget) return
          applyInvoiceAction(paidTarget, "marked as paid", { status: "paid" }, note)
        }}
      />
      <ConfirmDialog
        open={Boolean(unpaidTarget)}
        setOpen={() => setUnpaidTarget(null)}
        title="Mark this invoice as unpaid?"
        confirmLabel="Mark as unpaid"
        noteEnabled
        onConfirm={(note) => {
          if (!unpaidTarget) return
          applyInvoiceAction(unpaidTarget, "marked as unpaid", { status: "unpaid" }, note)
        }}
      />
      <ConfirmDialog
        open={Boolean(voidTarget)}
        setOpen={() => setVoidTarget(null)}
        title="Void this invoice?"
        danger
        noteEnabled
        onConfirm={(note) => {
          if (!voidTarget) return
          applyInvoiceAction(voidTarget, "voided", { status: "voided" }, note)
        }}
      />
    </>
  )
}
