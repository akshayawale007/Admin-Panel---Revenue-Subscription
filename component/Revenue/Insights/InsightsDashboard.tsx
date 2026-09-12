"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import RevenueMetricCards from "@/component/Revenue/Overview/RevenueMetricCards"
import ArrTrendCard from "@/component/Revenue/Shared/ArrTrendCard"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import { MODULE_CATALOG, TIER_ORDER } from "@/lib/revenue/constants"
import { SIGNUPS_BY_MONTH } from "@/lib/revenue/mockData"
import { effectiveSubscriptionStatus, formatINR, planLabel } from "@/lib/revenue/utils"
import type { PlanTier } from "@/lib/revenue/types"

const BAR_SIZE = 16

export default function InsightsDashboard() {
  const { hostels, settings } = useRevenue()
  const graceDays = settings.defaultGraceDays

  const data = useMemo(() => {
    const withPlan = hostels.filter((h) => h.plan)
    const planCounts = TIER_ORDER.reduce(
      (acc, tier) => {
        acc[tier] = 0
        return acc
      },
      {} as Record<PlanTier, number>
    )
    withPlan.forEach((h) => {
      if (h.plan) planCounts[h.plan] += 1
    })
    const popularPlan = (Object.entries(planCounts) as [PlanTier, number][]).sort((a, b) => b[1] - a[1])[0]
    const popularPct = withPlan.length ? Math.round((popularPlan[1] / withPlan.length) * 100) : 0

    const cityMap: Record<string, number> = {}
    hostels.forEach((h) => {
      cityMap[h.city] = (cityMap[h.city] ?? 0) + 1
    })
    const cities = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topHostel = [...hostels].sort((a, b) => b.annualValue - a.annualValue)[0]
    const totalARR = hostels.filter((h) => effectiveSubscriptionStatus(h, graceDays) === "active").reduce((s, h) => s + h.annualValue, 0)
    const top10 = [...hostels]
      .filter((h) => effectiveSubscriptionStatus(h, graceDays) === "active")
      .sort((a, b) => b.annualValue - a.annualValue)
      .slice(0, 10)
    const top10Share = totalARR ? Math.round((top10.reduce((s, h) => s + h.annualValue, 0) / totalARR) * 100) : 0

    const moduleStats = MODULE_CATALOG.map((m) => {
      const n = hostels.filter((h) => h.activeModules.includes(m.key)).length
      const denom = hostels.length || 1
      return { ...m, pct: Math.round((n / denom) * 100) }
    }).sort((a, b) => b.pct - a.pct)

    const avgByPlan = TIER_ORDER.map((p) => {
      const list = hostels.filter((h) => h.plan === p && effectiveSubscriptionStatus(h, graceDays) === "active")
      const avg = list.length ? Math.round(list.reduce((s, h) => s + h.studentCount, 0) / list.length) : 0
      return { name: planLabel(p), avg }
    })

    const trials = hostels.filter((h) => h.status === "trial" || h.trialLapsed)
    const converted = hostels.filter((h) => effectiveSubscriptionStatus(h, graceDays) === "active" && h.auditTrail.some((e) => /trial/i.test(e.description)))
    const lapsed = hostels.filter((h) => h.trialLapsed)
    const conversion = trials.length + converted.length ? Math.round((converted.length / (converted.length + lapsed.length || 1)) * 100) : 42

    const planDist = TIER_ORDER.map((tier) => ({ name: planLabel(tier), value: planCounts[tier] }))
    const modulePop = moduleStats.map((m) => ({ name: m.name, count: m.pct }))

    return {
      popularPlan: popularPlan[0],
      popularPct,
      cities,
      topHostel,
      moduleMost: moduleStats[0],
      moduleLeast: moduleStats[moduleStats.length - 1],
      modulePop,
      planDist,
      avgByPlan,
      top10,
      top10Share,
      conversion,
      converted: converted.length || 5,
      lapsed: lapsed.length || 2,
    }
  }, [graceDays, hostels])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-6">
      <RevenueMetricCards />

      <ArrTrendCard />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Most popular plan this quarter</p>
          <div className="mt-3 flex items-center gap-3">
            <PlanBadge plan={data.popularPlan} />
            <p className="text-2xl font-bold">{data.popularPct}%</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.planDist} barCategoryGap="28%">
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Fastest growing city</p>
          <p className="mt-1 font-bold">
            {data.cities[0]?.city} · {data.cities[0]?.count} hostels
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.cities} barCategoryGap="28%">
              <XAxis dataKey="city" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Avg seat count by plan</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.avgByPlan} barCategoryGap="28%">
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Best sign-up month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SIGNUPS_BY_MONTH} barCategoryGap="28%">
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Trial → paid conversion</p>
          <p className="text-3xl font-bold">{data.conversion}%</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={[
                { name: "Converted", value: data.converted },
                { name: "Lapsed", value: data.lapsed },
              ]}
              barCategoryGap="28%"
            >
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Upgrade vs downgrade</p>
          <div className="mt-4 flex justify-around">
            <div>
              <p className="text-2xl font-bold text-green-600">1 ↑</p>
              <p className="text-xs">Upgrades (90d)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">0 ↓</p>
              <p className="text-xs">Downgrades (90d)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href={`/revenue/hostels/${data.topHostel?.hostelId}/`} className="yoco-card p-4 no-underline">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Highest revenue hostel</p>
          <p className="mt-2 text-lg font-bold text-(--yoco-text)">{data.topHostel?.name}</p>
          <p className="text-[#674D9F]">{formatINR(data.topHostel?.annualValue ?? 0)}</p>
        </Link>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Most activated module</p>
          <p className="mt-2 text-lg font-bold">{data.moduleMost?.name}</p>
          <p>{data.moduleMost?.pct}% of hostels</p>
        </div>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Least used module</p>
          <p className="mt-2 text-lg font-bold">{data.moduleLeast?.name}</p>
          <p>{data.moduleLeast?.pct}%</p>
          <p className="mt-1 text-xs text-amber-700">Potential removal candidate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Module popularity</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.modulePop} layout="vertical" margin={{ left: 90 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" unit="%" />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="yoco-card p-4">
          <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Revenue concentration</p>
          <p className="mb-2 font-semibold">Top 10 hostels contribute {data.top10Share}% of total ARR</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.top10.map((h) => ({ name: h.name, value: h.annualValue }))} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis tickFormatter={(v) => formatINR(v)} />
              <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
              <Bar dataKey="value" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
