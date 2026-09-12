"use client"

import { useMemo, useState } from "react"
import debounce from "lodash/debounce"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import CommonTable from "@/component/Common/Table/Table"
import DebounceAsyncSearch from "@/component/Common/Search/Search"
import ComingSoonDialog from "@/component/Revenue/Shared/ComingSoonDialog"
import TableActionMenu from "@/component/Revenue/Shared/TableActionMenu"
import InvoicePreviewModal from "@/component/Revenue/Shared/InvoicePreviewModal"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { billedRateFor, daysUntil, defaultInvoiceDueDate, effectiveSubscriptionStatus, formatDate, formatDateTime, gstBreakdown, subscriptionAccessEndDate } from "@/lib/revenue/utils"
import type { HostelSubscription, Invoice } from "@/lib/revenue/types"
import dayjs from "dayjs"
import { toast } from "react-toastify"

type Row = HostelSubscription & { daysLeft: number }

function daysClass(days: number) {
  if (days <= 7) return "font-semibold text-red-600"
  if (days <= 15) return "font-semibold text-amber-600"
  return "text-(--yoco-text-muted)"
}

export default function RenewalAlerts() {
  const { hostels, updateHostel, addAudit, settings, nextInvoiceNo, planRates, customModuleRates, planModules } = useRevenue()
  const graceDays = settings.defaultGraceDays
  const router = useRouter()
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [invoiceHostel, setInvoiceHostel] = useState<Row | null>(null)
  const [draft, setDraft] = useState<Invoice | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [query, setQuery] = useState("")

  const onSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQuery(value.toLowerCase().trim())
        setPage(1)
      }, 300),
    []
  )

  const rows = useMemo<Row[]>(
    () =>
      hostels
        .filter((h) => {
          const status = effectiveSubscriptionStatus(h, graceDays)
          return status === "active"
        })
        .map((h) => ({
          ...h,
          daysLeft: daysUntil(subscriptionAccessEndDate(h, graceDays).format("YYYY-MM-DD")),
        }))
        .filter((h) => h.daysLeft >= 0 && h.daysLeft <= 30)
        .filter((h) => {
          if (!query) return true
          const hay = [h.name, h.hostelCode].join(" ").toLowerCase()
          return hay.includes(query)
        })
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [graceDays, hostels, query]
  )

  const pageRows = rows.slice((page - 1) * limit, page * limit)

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: "name", header: "Hostel Name" },
      { header: "Plan", cell: ({ row }) => <PlanBadge plan={row.original.plan} trial={row.original.status === "trial"} /> },
      { accessorKey: "studentCount", header: "Seats" },
      { header: "Expiry Date", cell: ({ row }) => formatDate(row.original.renewalDate) },
      {
        header: "Days Remaining",
        cell: ({ row }) => (
          <span className={daysClass(row.original.daysLeft)}>{row.original.daysLeft}</span>
        ),
      },
      {
        header: "Last Contacted",
        cell: ({ row }) => (row.original.lastContactedAt ? formatDateTime(row.original.lastContactedAt) : "—"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <TableActionMenu
            actions={[
              {
                label: "Notify",
                onClick: () => setNotifyOpen(true),
              },
              {
                label: "Mark contacted",
                onClick: () => updateHostel(row.original.hostelId, { lastContactedAt: dayjs().toISOString() }),
              },
              {
                label: "View",
                onClick: () => router.push(`/revenue/hostels/${row.original.hostelId}/`),
              },
              {
                label: "Invoice",
                onClick: () => {
                  const rate = billedRateFor(row.original.plan, row.original.activeModules, {
                    planRates,
                    customModuleRates,
                    planModules,
                  })
                  const amount = row.original.studentCount * rate * 12
                  const gst = gstBreakdown(amount, true, settings.gstRate, settings)
                  const inv: Invoice = {
                    id: `inv-${Date.now()}`,
                    invoiceNo: nextInvoiceNo(),
                    billingPeriodStart: row.original.renewalDate,
                    billingPeriodEnd: dayjs(row.original.renewalDate).add(1, "year").format("YYYY-MM-DD"),
                    students: row.original.studentCount,
                    amount,
                    gst: gst.gst,
                    total: gst.total,
                    status: "unpaid",
                    dateGenerated: dayjs().format("YYYY-MM-DD"),
                    sameState: true,
                    dueDate: defaultInvoiceDueDate(dayjs().format("YYYY-MM-DD")),
                    modules: row.original.activeModules,
                    plan: row.original.plan,
                    rate,
                    invoiceType: "annual_subscription",
                    billingCycle: row.original.billingCycle,
                    proRatedAdjustment: row.original.proRatedAdjustment,
                  }
                  setDraft(inv)
                  setInvoiceHostel(row.original)
                },
              },
            ]}
          />
        ),
      },
    ],
    [addAudit, nextInvoiceNo, router, settings.gstRate, updateHostel]
  )

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">      <CommonTable<Row>
        showCheckbox={false}
        showExport={false}
        overflowX={false}
        data={pageRows}
        extraColumn={columns}
        totalLabel="Alerts"
        totalCount={rows.length}
        paginationShow
        payload={{ pagination: { page, limit } }}
        onPagination={(p, l) => {
          setPage(p)
          setLimit(l)
        }}
        children={<DebounceAsyncSearch onSearch={onSearch} debounceTimeout={300} placeholder="Search hostel" />}
      />
      <ComingSoonDialog open={notifyOpen} setOpen={setNotifyOpen} />
      <InvoicePreviewModal
        open={Boolean(draft)}
        setOpen={() => setDraft(null)}
        invoice={draft}
        hostel={invoiceHostel}
        settings={settings}
        onConfirmSend={() => {
          if (!draft || !invoiceHostel) return
          updateHostel(invoiceHostel.hostelId, { invoices: [draft, ...invoiceHostel.invoices] })
          addAudit(invoiceHostel.hostelId, `Invoice ${draft.invoiceNo} generated`)
          toast.success("Invoice sent", { autoClose: 3000 })
          setDraft(null)
        }}
      />
    </div>
  )
}
