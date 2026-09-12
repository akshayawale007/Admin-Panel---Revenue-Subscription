"use client"

import { ClockIcon } from "@heroicons/react/24/outline"
import { formatDateTime } from "@/lib/revenue/utils"
import type { HostelSubscription } from "@/lib/revenue/types"

export default function HistoryTab({ hostel }: { hostel: HostelSubscription }) {
  const events = [...hostel.auditTrail].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  if (!events.length) {
    return <p className="py-16 text-center text-sm text-(--yoco-text-muted)">No records found</p>
  }

  return (
    <ol className="relative border-l border-(--yoco-border) pl-6">
      {events.map((e) => (
        <li key={e.id} className="mb-6">
          <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#674D9F] text-white">
            <ClockIcon className="h-3 w-3" />
          </span>
          <p className="font-semibold text-(--yoco-text)">{e.description}</p>
          <p className="text-xs text-(--yoco-text-muted)">
            {formatDateTime(e.timestamp)} · {e.adminName}
          </p>
        </li>
      ))}
    </ol>
  )
}
