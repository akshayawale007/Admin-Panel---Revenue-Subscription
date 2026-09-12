"use client"

import { useMemo, useState } from "react"
import debounce from "lodash/debounce"
import { ColumnDef } from "@tanstack/react-table"
import CommonTable from "@/component/Common/Table/Table"
import Button from "@/component/Common/Button/Button"
import Modal from "@/component/Common/Modal/Modal"
import ConfirmDialog from "@/component/Revenue/Shared/ConfirmDialog"
import ComingSoonDialog from "@/component/Revenue/Shared/ComingSoonDialog"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import StatusBadge from "@/component/Revenue/Shared/StatusBadge"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import EditBeforeApproveDrawer from "./EditBeforeApproveDrawer"
import { formatDate, requestTypeLabel } from "@/lib/revenue/utils"
import type { HostelSubscription, PendingRequest } from "@/lib/revenue/types"
import TableActionMenu from "@/component/Revenue/Shared/TableActionMenu"
import DebounceAsyncSearch from "@/component/Common/Search/Search"
import YocoSelect from "@/component/Common/Select/YocoSelect"
import { useSimulatedLoading, RevenueSkeleton } from "@/component/Revenue/Shared/RevenueSkeleton"

type Row = PendingRequest & { _id: string; hostel: HostelSubscription }

const PILLS = [
  { id: "all", label: "All" },
  { id: "new_subscription", label: "New Subscriptions" },
  { id: "plan", label: "Plan Changes" },
  { id: "student_count_update", label: "Count Updates" },
  { id: "on_hold", label: "On Hold" },
]

export default function ApprovalQueue() {
  const { hostels, approveRequest, rejectRequest, holdRequest } = useRevenue()
  const loading = useSimulatedLoading()
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [pill, setPill] = useState("all")
  const [edit, setEdit] = useState<Row | null>(null)
  const [reject, setReject] = useState<Row | null>(null)
  const [reason, setReason] = useState("")
  const [hold, setHold] = useState<Row | null>(null)
  const [proof, setProof] = useState<Row | null>(null)
  const [query, setQuery] = useState("")

  const onSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQuery(value.toLowerCase().trim())
      }, 300),
    []
  )

  const rows = useMemo<Row[]>(() => {
    const all = hostels.flatMap((h) =>
      h.pendingRequests.map((r) => ({ ...r, _id: r.id, hostel: h }))
    )
    return all.filter((r) => {
      if (pill === "all") {
        if (!(r.status === "pending" || r.status === "on_hold")) return false
      } else if (pill === "on_hold") {
        if (r.status !== "on_hold") return false
      } else if (pill === "plan") {
        if (!(r.type === "plan_upgrade" || r.type === "plan_downgrade")) return false
      } else if (r.type !== pill) {
        return false
      }
      if (!query) return true
      const hay = [r.hostel.name, r.hostel.hostelCode].join(" ").toLowerCase()
      return hay.includes(query)
    })
  }, [hostels, pill, query])

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { header: "Hostel Name", cell: ({ row }) => row.original.hostel.name },
      { header: "Request Type", cell: ({ row }) => requestTypeLabel(row.original.type) },
      { header: "Plan Requested", cell: ({ row }) => <PlanBadge plan={row.original.planRequested ?? row.original.hostel.plan} /> },
      { header: "Seats", cell: ({ row }) => row.original.studentCount ?? row.original.hostel.studentCount },
      { header: "Submitted On", cell: ({ row }) => formatDate(row.original.submittedOn) },
      { header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <TableActionMenu
            actions={[
              {
                label: "Approve",
                onClick: () => approveRequest(row.original.hostel.hostelId, row.original.id),
              },
              {
                label: "Reject",
                danger: true,
                onClick: () => {
                  setReject(row.original)
                  setReason("")
                },
              },
              { label: "Proof", onClick: () => setProof(row.original) },
              { label: "Edit", onClick: () => setEdit(row.original) },
              { label: "Hold", onClick: () => setHold(row.original) },
              { label: "Notify", onClick: () => setNotifyOpen(true) },
            ]}
          />
        ),
      },
    ],
    [approveRequest]
  )

  if (loading) return <RevenueSkeleton rows={8} />

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <CommonTable<Row>
        showCheckbox={false}
        showExport={false}
        overflowX={false}
        data={rows}
        extraColumn={columns}
        totalLabel="Approvals"
        totalCount={rows.length}
        paginationShow
        children={
          <>
            <YocoSelect
              value={pill}
              onChange={setPill}
              ariaLabel="Filter approvals"
              options={PILLS.map((p) => ({ value: p.id, label: p.label }))}
            />
            <DebounceAsyncSearch onSearch={onSearch} debounceTimeout={300} placeholder="Search hostel" />
          </>
        }
      />
      <ComingSoonDialog open={notifyOpen} setOpen={setNotifyOpen} />
      <EditBeforeApproveDrawer row={edit} onClose={() => setEdit(null)} />
      <Modal open={Boolean(reject)} setOpen={() => setReject(null)} width="md">
        <div className="p-5">
          <p className="yoco-form-title">Reject this request?</p>
          <textarea className="yoco-input mt-3 min-h-24 px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="mt-4 flex justify-end gap-2">
            <Button title="Cancel" variant="secondary" onClick={() => setReject(null)} />
            <Button
              title="Reject"
              variant="danger"
              disabled={!reason.trim()}
              onClick={() => {
                if (!reject || !reason.trim()) return
                rejectRequest(reject.hostel.hostelId, reject.id, reason)
                setReject(null)
              }}
            />
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(hold)}
        setOpen={() => setHold(null)}
        title="Put this request on hold?"
        onConfirm={() => {
          if (!hold) return
          holdRequest(hold.hostel.hostelId, hold.id)
        }}
      />
      <Modal open={Boolean(proof)} setOpen={() => setProof(null)} width="lg">
        <div className="p-5">
          <p className="yoco-form-title">Payment proof</p>
          {proof?.hostel.paymentProofs[0] ? (
            <p className="mt-2 text-sm">
              {proof.hostel.paymentProofs[0].fileName} · {formatDate(proof.hostel.paymentProofs[0].uploadedOn)}
            </p>
          ) : (
            <p className="mt-3 py-10 text-center text-sm text-(--yoco-text-muted)">No records found</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

export function ApprovalRow() {
  return null
}
