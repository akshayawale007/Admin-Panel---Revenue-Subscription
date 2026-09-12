"use client"

import { statusLabel } from "@/lib/revenue/utils"

const styles: Record<string, string> = {
  active: "bg-[#674D9F] text-white",
  trial: "bg-blue-100 text-blue-800",
  expired: "bg-red-100 text-red-800",
  deactivated: "bg-slate-200 text-slate-700",
  grace: "bg-amber-100 text-amber-800",
  voided: "bg-red-100 text-red-800",
  pending: "bg-orange-100 text-orange-800",
  on_hold: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-orange-100 text-orange-800",
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] ?? "bg-(--yoco-surface-muted) text-(--yoco-text-muted)"
      }`}
    >
      {statusLabel(status)}
    </span>
  )
}
