"use client"

import { PLAN_COLORS } from "@/lib/revenue/constants"
import type { PlanTier } from "@/lib/revenue/types"
import { planLabel } from "@/lib/revenue/utils"

export default function PlanBadge({
  plan,
  trial,
  size = "md",
  className = "",
}: {
  plan: PlanTier | null
  trial?: boolean
  size?: "sm" | "md"
  className?: string
}) {
  const pad = size === "sm" ? "px-2 py-px text-[10px]" : "px-2.5 py-0.5 text-xs"
  if (trial) {
    return (
      <span className={`inline-flex rounded-md bg-blue-100 font-semibold text-blue-800 ${pad} ${className}`}>
        Trial
      </span>
    )
  }
  if (!plan) {
    return (
      <span className={`inline-flex rounded-md bg-(--yoco-surface-muted) font-semibold text-(--yoco-text-muted) ${pad} ${className}`}>
        —
      </span>
    )
  }
  return (
    <span className={`inline-flex rounded-md font-semibold ${pad} ${PLAN_COLORS[plan].chipClass} ${className}`}>
      {planLabel(plan)}
    </span>
  )
}
