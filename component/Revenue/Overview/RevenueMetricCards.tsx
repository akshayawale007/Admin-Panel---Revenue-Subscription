"use client"

import { useMemo } from "react"
import dayjs from "dayjs"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import MetricCard from "./MetricCard"
import { effectiveSubscriptionStatus, formatINR, subscriptionAccessEndDate } from "@/lib/revenue/utils"

export default function RevenueMetricCards() {
  const { hostels, settings } = useRevenue()
  const graceDays = settings.defaultGraceDays

  const metrics = useMemo(() => {
    const active = hostels.filter((h) => effectiveSubscriptionStatus(h, graceDays) === "active")
    const pending = hostels.flatMap((h) =>
      h.pendingRequests.filter((r) => r.status === "pending" || r.status === "on_hold")
    )
    const totalARR = active.reduce((s, h) => s + h.annualValue, 0)
    const billedStudents = active.reduce((s, h) => s + h.studentCount, 0)
    const expiring = hostels.filter((h) => {
      const d = dayjs(subscriptionAccessEndDate(h, graceDays).format("YYYY-MM-DD")).diff(dayjs(), "day")
      const status = effectiveSubscriptionStatus(h, graceDays)
      return d >= 0 && d <= 30 && status === "active"
    }).length
    return {
      totalARR,
      active: active.length,
      pending: pending.length,
      billedStudents,
      expiring,
      totalHostels: hostels.length,
    }
  }, [graceDays, hostels])

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard size="comfortable" label="Total ARR" value={formatINR(metrics.totalARR)} href="/revenue/" />
      <MetricCard
        size="comfortable"
        label="Active subscriptions"
        value={String(metrics.active)}
        href="/revenue/?status=active"
      />
      <MetricCard
        size="comfortable"
        label="Upgrade requests"
        value={String(metrics.pending)}
        href="/revenue/?request=open"
      />
      <MetricCard
        size="comfortable"
        label="Expiring in 30 days"
        value={String(metrics.expiring)}
        href="/revenue/?expiring=1"
      />
      <MetricCard
        size="comfortable"
        label="Billed seats"
        value={metrics.billedStudents.toLocaleString("en-IN")}
        href="/revenue/"
      />
      <MetricCard
        size="comfortable"
        label="Total hostels"
        value={String(metrics.totalHostels)}
        href="/revenue/"
      />
    </div>
  )
}
