"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import debounce from "lodash/debounce"
import { EyeIcon } from "@heroicons/react/24/outline"
import CommonTable from "@/component/Common/Table/Table"
import DebounceAsyncSearch from "@/component/Common/Search/Search"
import YocoSelect from "@/component/Common/Select/YocoSelect"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import StatusBadge from "@/component/Revenue/Shared/StatusBadge"
import { RevenueSkeleton, useSimulatedLoading } from "@/component/Revenue/Shared/RevenueSkeleton"
import type { HostelSubscription, Invoice, PendingRequest } from "@/lib/revenue/types"
import { daysUntil, effectiveSubscriptionStatus, formatDate, isInGracePeriod, isTrialSubscription, statusLabel, subscriptionAccessEndDate, subscriptionLifecycleCaption, subscriptionPlanLabel } from "@/lib/revenue/utils"
import { escapeCsvField } from "@/utils/exportCsv"
import { MODULE_CATALOG } from "@/lib/revenue/constants"

const PLAN_OPTIONS = [
  { id: "all", label: "All plans" },
  { id: "PREMIUM", label: "Premium" },
  { id: "ADVANCED", label: "Advanced" },
  { id: "ELITE", label: "Elite" },
  { id: "CUSTOM", label: "Custom" },
] as const

const STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "active", label: "Active" },
  { id: "grace", label: "Grace" },
  { id: "trial", label: "Trial" },
  { id: "expired", label: "Expired" },
  { id: "deactivated", label: "Deactivated" },
] as const

const INVOICE_OPTIONS = [
  { id: "all", label: "All invoices" },
  { id: "unpaid", label: "Pending invoices" },
] as const

const REQUEST_OPTIONS = [
  { id: "all", label: "Upgrades" },
  { id: "pending", label: "Pending" },
] as const

function matchesStatus(hostel: HostelSubscription, filter: string, graceDays: number) {
  if (filter === "all") return true
  const status = effectiveSubscriptionStatus(hostel, graceDays)
  if (filter === "trial") {
    return isTrialSubscription(hostel) && status !== "expired" && status !== "deactivated"
  }
  if (filter === "grace") return isInGracePeriod(hostel, graceDays)
  if (filter === "active") return status === "active" && !isInGracePeriod(hostel, graceDays)
  return status === filter
}

function isExpiringSoon(hostel: HostelSubscription, graceDays: number) {
  const days = daysUntil(subscriptionAccessEndDate(hostel, graceDays).format("YYYY-MM-DD"))
  const status = effectiveSubscriptionStatus(hostel, graceDays)
  return days >= 0 && days <= 30 && status === "active"
}

function openRequests(requests: PendingRequest[]) {
  return requests
    .filter((r) => r.status === "pending" || r.status === "on_hold")
    .slice()
    .sort((a, b) => (a.submittedOn < b.submittedOn ? 1 : -1))
}

function latestOpenRequest(requests: PendingRequest[]) {
  return openRequests(requests)[0] ?? null
}

function invoiceColumnStatus(invoices: Invoice[]): "paid" | "unpaid" | null {
  const open = invoices.filter((i) => i.status !== "voided")
  if (!open.length) return null
  if (open.some((i) => i.status === "unpaid")) return "unpaid"
  return "paid"
}

export default function HostelSubscriptionTable() {
  const { hostels, settings } = useRevenue()
  const graceDays = settings.defaultGraceDays
  const router = useRouter()
  const searchParams = useSearchParams()
  const loading = useSimulatedLoading(800)
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [invoiceFilter, setInvoiceFilter] = useState("all")
  const [requestFilter, setRequestFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const expiringOnly = searchParams.get("expiring") === "1"

  useEffect(() => {
    const status = searchParams.get("status")
    if (!status) return
    setStatusFilter(status)
  }, [searchParams])

  useEffect(() => {
    const invoice = searchParams.get("invoice")
    if (invoice === "unpaid") setInvoiceFilter("unpaid")
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get("request") === "open") setRequestFilter("pending")
  }, [searchParams])

  const onSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQuery(value.toLowerCase().trim())
        setPage(1)
      }, 300),
    []
  )

  const filtered = useMemo(() => {
    return hostels.filter((h) => {
      if (planFilter !== "all" && h.plan !== planFilter) return false
      if (!matchesStatus(h, statusFilter, graceDays)) return false
      if (requestFilter === "pending" && !latestOpenRequest(h.pendingRequests)) return false
      if (invoiceFilter === "unpaid" && !h.invoices.some((inv) => inv.status === "unpaid")) return false
      if (expiringOnly && !isExpiringSoon(h, graceDays)) return false
      if (!query) return true
      const hay = [
        h.name,
        h.city,
        h.state,
        h.hostelCode,
        subscriptionPlanLabel(h),
        statusLabel(effectiveSubscriptionStatus(h, graceDays)),
        h.adminName,
        h.adminPhone,
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(query)
    })
  }, [expiringOnly, graceDays, hostels, invoiceFilter, planFilter, query, requestFilter, statusFilter])

  const pendingRequestCount = useMemo(
    () => hostels.reduce((sum, h) => sum + openRequests(h.pendingRequests).length, 0),
    [hostels]
  )
  const pendingInvoiceCount = useMemo(
    () => hostels.reduce((sum, h) => sum + h.invoices.filter((inv) => inv.status === "unpaid").length, 0),
    [hostels]
  )

  const pageRows = filtered.slice((page - 1) * limit, page * limit)

  const columns = useMemo<ColumnDef<HostelSubscription>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Hostel",
        size: 170,
        cell: ({ row }) => (
          <button
            type="button"
            className="w-full cursor-pointer text-left"
            onClick={() => router.push(`/revenue/hostels/${row.original.hostelId}/`)}
          >
            <p className="font-semibold">{row.original.name}</p>
            <p className="text-xs text-(--yoco-text-muted)">{row.original.hostelCode}</p>
          </button>
        ),
      },
      { accessorKey: "studentCount", header: "Seats", size: 80 },
      {
        accessorKey: "plan",
        header: "Current Plan",
        cell: ({ row }) => {
          const caption = subscriptionLifecycleCaption(row.original, graceDays)
          return (
            <div className="flex flex-col items-start gap-0.5">
              <PlanBadge plan={row.original.plan} trial={isTrialSubscription(row.original)} />
              <span className={`text-[10px] font-medium leading-tight ${caption.className}`}>{caption.label}</span>
            </div>
          )
        },
      },
      {
        id: "requestType",
        size: 188,
        meta: { align: "center" },
        header: () => (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            Upgrade requests
            {pendingRequestCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#EDE8F4] px-1.5 text-[11px] font-semibold leading-5 text-[#674D9F]">
                {pendingRequestCount}
              </span>
            ) : null}
          </span>
        ),
        cell: ({ row }) =>
          latestOpenRequest(row.original.pendingRequests) ? (
            <StatusBadge status="pending" />
          ) : (
            <span className="text-(--yoco-text-muted)">—</span>
          ),
      },
      {
        id: "invoices",
        size: 132,
        header: () => (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            Invoices
            {pendingInvoiceCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#EDE8F4] px-1.5 text-[11px] font-semibold leading-5 text-[#674D9F]">
                {pendingInvoiceCount}
              </span>
            ) : null}
          </span>
        ),
        cell: ({ row }) => {
          const status = invoiceColumnStatus(row.original.invoices)
          if (!status) return <span className="text-(--yoco-text-muted)">—</span>
          return <StatusBadge status={status} />
        },
      },
      {
        id: "dates",
        header: "Billing Period",
        size: 148,
        cell: ({ row }) => {
          const days = daysUntil(subscriptionAccessEndDate(row.original, graceDays).format("YYYY-MM-DD"))
          const showExpiry = isExpiringSoon(row.original, graceDays)
          return (
            <div className="flex flex-col gap-0.5 text-xs leading-tight">
              <p>
                <span className="mr-1 text-(--yoco-text-muted)">Start</span>
                {formatDate(row.original.subscriptionStartDate)}
              </p>
              <p>
                <span className="mr-1 text-(--yoco-text-muted)">Renew</span>
                {formatDate(row.original.renewalDate)}
              </p>
              {showExpiry ? (
                <p className="font-medium text-red-600">
                  {days === 0 ? "Expiring today" : `Expiring in ${days} days`}
                </p>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            type="button"
            aria-label="View hostel"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--yoco-input-border) bg-(--yoco-input-bg) text-(--yoco-text) shadow-sm hover:border-(--yoco-primary)"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/revenue/hostels/${row.original.hostelId}/`)
            }}
          >
            <EyeIcon className="size-4" />
          </button>
        ),
      },
    ],
    [graceDays, pendingInvoiceCount, pendingRequestCount, router]
  )

  const exportRows = (rows: HostelSubscription[]) => {
    const header = [
      "Hostel Name",
      "City",
      "State",
      "Plan Tier",
      "Seats",
      "Annual Value (₹)",
      "Start Date",
      "Renewal Date",
      "Status",
      "Active Modules",
      "Last Payment Date",
      "Admin Notes",
    ]
    const body = rows.map((row) => [
      row.name,
      row.city,
      row.state,
      subscriptionPlanLabel(row),
      row.studentCount,
      row.annualValue,
      formatDate(row.subscriptionStartDate),
      formatDate(row.renewalDate),
      subscriptionLifecycleCaption(row, graceDays).label,
      row.activeModules.map((k) => MODULE_CATALOG.find((m) => m.key === k)?.name ?? k).join("; "),
      formatDate(row.lastPaymentDate),
      row.notes.map((n) => n.text).join("; "),
    ])
    const csv = [header.map(escapeCsvField).join(","), ...body.map((r) => r.map(escapeCsvField).join(","))].join(
      "\n"
    )
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "revenue-hostels.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <RevenueSkeleton rows={8} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
    <CommonTable<HostelSubscription>
      showCheckbox={true}
      showExport={true}
      overflowX={true}
      loading={false}
      paginationShow={true}
      totalLabel="Hostels"
      totalCount={filtered.length}
      data={pageRows}
      extraColumn={columns}
      payload={{ pagination: { page, limit } }}
      onPagination={(p, l) => {
        setPage(p)
        setLimit(l)
      }}
      onExportSelected={exportRows}
      children={
        <>
          <YocoSelect
            value={planFilter}
            onChange={(next) => {
              setPlanFilter(next)
              setPage(1)
            }}
            ariaLabel="Filter by plan"
            options={PLAN_OPTIONS.map((item) => ({ value: item.id, label: item.label }))}
          />
          <YocoSelect
            value={statusFilter}
            onChange={(next) => {
              setStatusFilter(next)
              setPage(1)
            }}
            ariaLabel="Filter by status"
            options={STATUS_OPTIONS.map((item) => ({ value: item.id, label: item.label }))}
          />
          <YocoSelect
            value={invoiceFilter}
            onChange={(next) => {
              setInvoiceFilter(next)
              setPage(1)
            }}
            ariaLabel="Filter by invoice status"
            options={INVOICE_OPTIONS.map((item) => ({ value: item.id, label: item.label }))}
          />
          <YocoSelect
            value={requestFilter}
            onChange={(next) => {
              setRequestFilter(next)
              setPage(1)
            }}
            ariaLabel="Filter by upgrade request"
            options={REQUEST_OPTIONS.map((item) => ({ value: item.id, label: item.label }))}
          />
          <DebounceAsyncSearch onSearch={onSearch} debounceTimeout={300} placeholder="Search hostels" />
        </>
      }
    />
    </div>
  )
}

export function HostelRowClickBridge() {
  return null
}
