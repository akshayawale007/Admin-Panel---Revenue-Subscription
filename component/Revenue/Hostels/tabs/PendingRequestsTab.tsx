"use client"

import { useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { EyeIcon } from "@heroicons/react/24/outline"
import CommonTable from "@/component/Common/Table/Table"
import Button from "@/component/Common/Button/Button"
import Modal from "@/component/Common/Modal/Modal"
import TableActionMenu from "@/component/Revenue/Shared/TableActionMenu"
import StatusBadge from "@/component/Revenue/Shared/StatusBadge"
import ConfirmDialog from "@/component/Revenue/Shared/ConfirmDialog"
import RequestViewModal from "./RequestViewModal"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { formatDate, requestTypeLabel } from "@/lib/revenue/utils"
import type { HostelSubscription, PendingRequest, RevenueViewerRole } from "@/lib/revenue/types"

export default function PendingRequestsTab({
  hostel,
  viewerRole = "admin",
}: {
  hostel: HostelSubscription
  viewerRole?: RevenueViewerRole
}) {
  const { approveRequest, rejectRequest, withdrawPendingRequest } = useRevenue()
  const isWarden = viewerRole === "warden"
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [active, setActive] = useState<PendingRequest | null>(null)
  const [detail, setDetail] = useState<PendingRequest | null>(null)
  const [approveTarget, setApproveTarget] = useState<PendingRequest | null>(null)

  const rows = hostel.pendingRequests.map((r) => ({ ...r, _id: r.id }))

  const columns = useMemo<ColumnDef<PendingRequest & { _id: string }>[]>(
    () => [
      {
        header: "Request type",
        size: 220,
        cell: ({ row }) => (
          <div>
            <p>{requestTypeLabel(row.original.type)}</p>
            {row.original.scheduledFor ? (
              <p className="mt-0.5 text-xs text-amber-700">
                Takes effect {formatDate(row.original.scheduledFor)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        header: "Requested by",
        size: 220,
        cell: ({ row }) => (
          <span>
            {row.original.requestedBy}
            <span className="text-(--yoco-text-muted)"> · {row.original.requestedByDesignation}</span>
          </span>
        ),
      },
      { header: "Date submitted", size: 140, cell: ({ row }) => formatDate(row.original.submittedOn) },
      { header: "Status", size: 120, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        id: "actions",
        header: "Actions",
        size: 150,
        meta: { align: "center" },
        cell: ({ row }) => {
          const open = row.original.status === "pending" || row.original.status === "on_hold"
          return (
            <div className="flex flex-nowrap items-center justify-center gap-1.5">
              <TableActionMenu
                actions={
                  isWarden
                    ? [
                        {
                          label: "Withdraw",
                          disabled: row.original.status !== "pending",
                          onClick: () => withdrawPendingRequest(hostel.hostelId, row.original.id),
                        },
                      ]
                    : [
                        {
                          label: "Mark approved",
                          disabled: !open,
                          onClick: () => setApproveTarget(row.original),
                        },
                        {
                          label: "Mark rejected",
                          danger: true,
                          disabled: !open,
                          onClick: () => {
                            setActive(row.original)
                            setReason("")
                            setRejectOpen(true)
                          },
                        },
                      ]
                }
              />
              <button
                type="button"
                aria-label="View request"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--yoco-input-border) bg-(--yoco-input-bg) text-(--yoco-text) shadow-sm hover:border-(--yoco-primary)"
                onClick={() => setDetail(row.original)}
              >
                <EyeIcon className="size-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [approveRequest, hostel.hostelId, isWarden, withdrawPendingRequest]
  )

  return (
    <>
      <CommonTable
        showCheckbox={false}
        showSrNo={false}
        showExport={false}
        data={rows}
        extraColumn={columns}
        overflowX={false}
        paginationShow={rows.length > 10}
        tableHeight="min(520px, calc(100vh - 280px))"
      />
      <ConfirmDialog
        open={Boolean(approveTarget)}
        setOpen={(open) => {
          if (!open) setApproveTarget(null)
        }}
        title="Approve this request?"
        description="The subscription will update now or at the next renewal, and any new invoice will be generated."
        confirmLabel="Mark approved"
        noteEnabled
        onConfirm={(note) => {
          if (!approveTarget) return
          approveRequest(hostel.hostelId, approveTarget.id, note)
          setApproveTarget(null)
        }}
      />
      <Modal open={rejectOpen} setOpen={setRejectOpen} width="md">
        <div className="p-5">
          <p className="yoco-form-title">Reject this request?</p>
          <textarea
            className="yoco-input mt-3 min-h-24 px-3 py-2"
            placeholder="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button title="Cancel" variant="secondary" onClick={() => setRejectOpen(false)} />
            <Button
              title="Reject"
              variant="danger"
              disabled={!reason.trim()}
              onClick={() => {
                if (!active || !reason.trim()) return
                rejectRequest(hostel.hostelId, active.id, reason.trim())
                setRejectOpen(false)
              }}
            />
          </div>
        </div>
      </Modal>
      <RequestViewModal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        request={detail}
        hostel={hostel}
        viewerRole={viewerRole}
      />
    </>
  )
}
