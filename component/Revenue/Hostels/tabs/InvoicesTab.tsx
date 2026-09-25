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
import StatusBadge from "@/component/Revenue/Shared/StatusBadge"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { INVOICE_ACTOR } from "@/lib/revenue/constants"
import {
  defaultInvoiceDueDate,
  formatDate,
  formatINR,
  invoicePeriodCycleLabel,
} from "@/lib/revenue/utils"
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
  const [autoPrint, setAutoPrint] = useState(false)
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null)
  const [paidTarget, setPaidTarget] = useState<Invoice | null>(null)
  const [unpaidTarget, setUnpaidTarget] = useState<Invoice | null>(null)
  const [dueTarget, setDueTarget] = useState<Invoice | null>(null)
  const [dueDateValue, setDueDateValue] = useState("")
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Invoice | null>(null)
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
      {
        header: "Up. Req. Id",
        size: 100,
        meta: { align: "center" },
        cell: ({ row }) => {
          const invoice = row.original
          return invoice.invoiceType === "manual" || !invoice.upgradeRequestNo ? "—" : invoice.upgradeRequestNo
        },
      },
      { accessorKey: "invoiceNo", header: "Invoice No.", size: 150, meta: { align: "center" } },
      {
        header: "Billing Cycle",
        size: 108,
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className="block whitespace-normal text-center text-xs leading-snug">
            {invoicePeriodCycleLabel(row.original.billingPeriodStart, row.original.billingPeriodEnd)}
          </span>
        ),
      },
      {
        header: "Billing Period",
        size: 128,
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex flex-col items-center gap-0.5 text-center text-xs leading-tight">
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
        size: 92,
        meta: { align: "center" },
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
      { header: "Total", size: 92, meta: { align: "center" }, cell: ({ row }) => formatINR(row.original.total) },
      { header: "Status", size: 88, meta: { align: "center" }, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { header: "Generated On", size: 104, meta: { align: "center" }, cell: ({ row }) => formatDate(row.original.dateGenerated) },
      {
        id: "actions",
        header: "Actions",
        size: 112,
        minSize: 112,
        meta: { align: "center" },
        cell: ({ row }) => {
          const invoice = row.original
          return (
            <div className="flex flex-nowrap items-center justify-center gap-1">
              <TableActionMenu
                actions={
                  isWarden
                    ? [
                        {
                          label: "Download PDF",
                          onClick: () => {
                            setAutoPrint(true)
                            setPreview(invoice)
                          },
                        },
                      ]
                    : [
                        {
                          label: "Download PDF",
                          onClick: () => {
                            setAutoPrint(true)
                            setPreview(invoice)
                          },
                        },
                        {
                          label: "Add discount",
                          disabled: invoice.status !== "unpaid",
                          onClick: () => setEditTarget(invoice),
                        },
                        {
                          label: "Set due date",
                          disabled: invoice.status !== "unpaid",
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
                        { label: "Void", danger: true, onClick: () => setVoidTarget(invoice) },
                        { label: "Notify", onClick: () => setNotifyOpen(true) },
                      ]
                }
              />
              <button
                type="button"
                aria-label="View invoice"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--yoco-input-border) bg-(--yoco-input-bg) text-(--yoco-text) shadow-sm hover:border-(--yoco-primary)"
                onClick={() => {
                  setAutoPrint(false)
                  setPreview(invoice)
                }}
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
        compact
        overflowX={false}
        paginationShow
        tableHeight="min(520px, calc(100vh - 280px))"
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
      <ManualInvoiceModal
        open={Boolean(editTarget)}
        setOpen={(open) => {
          if (!open) setEditTarget(null)
        }}
        hostel={hostel}
        invoice={editTarget}
      />
      <InvoicePreviewModal
        open={Boolean(preview)}
        setOpen={() => {
          setPreview(null)
          setAutoPrint(false)
        }}
        invoice={preview}
        hostel={hostel}
        settings={settings}
        viewerRole={viewerRole}
        autoPrint={autoPrint}
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
