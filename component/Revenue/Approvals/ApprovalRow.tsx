"use client"

import type { HostelSubscription, PendingRequest } from "@/lib/revenue/types"
import { requestTypeLabel } from "@/lib/revenue/utils"

export default function ApprovalRow({
  hostel,
  request,
}: {
  hostel: HostelSubscription
  request: PendingRequest
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="font-semibold">{hostel.name}</span>
      <span className="text-sm text-(--yoco-text-muted)">{requestTypeLabel(request.type)}</span>
    </div>
  )
}
