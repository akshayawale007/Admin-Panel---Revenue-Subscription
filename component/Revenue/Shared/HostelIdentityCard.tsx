"use client"

import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { initials, isTrialSubscription, subscriptionLifecycleCaption } from "@/lib/revenue/utils"
import type { HostelSubscription } from "@/lib/revenue/types"

export default function HostelIdentityCard({
  hostel,
  showAvatar = false,
  codeLabel,
}: {
  hostel: HostelSubscription
  showAvatar?: boolean
  codeLabel?: string
}) {
  const { settings } = useRevenue()
  const caption = subscriptionLifecycleCaption(hostel, settings.defaultGraceDays)

  return (
    <div className="yoco-card flex flex-wrap items-center gap-4 p-4">
      {showAvatar ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#674D9F] text-sm font-bold text-white">
          {initials(hostel.name)}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{hostel.name}</p>
        <p className="text-sm text-(--yoco-text-muted)">
          {codeLabel ? `${codeLabel} : ${hostel.hostelCode}` : hostel.hostelCode}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1.5 pr-6">
        <p className={`text-sm font-semibold uppercase tracking-wide ${caption.className}`}>{caption.label}</p>
        <PlanBadge
          plan={hostel.plan}
          trial={isTrialSubscription(hostel)}
          size="sm"
          className="uppercase tracking-wide"
        />
      </div>
    </div>
  )
}
