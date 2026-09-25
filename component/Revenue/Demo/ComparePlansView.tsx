"use client"

import Button from "@/component/Common/Button/Button"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_CATALOG, PLAN_COLORS, STANDARD_TIERS } from "@/lib/revenue/constants"
import { formatRate, isHigherTier, isLowerTier, planLabel } from "@/lib/revenue/utils"
import type { PlanModuleConfig, PlanTier } from "@/lib/revenue/types"

export type ComparePlansViewProps = {
  currentPlan: PlanTier | null
  planModules: PlanModuleConfig
  canChoose?: boolean
  canChooseCustom?: boolean
  allowRenewCurrent?: boolean
  allowDowngrade?: boolean
  onChoosePlan?: (tier: PlanTier) => void
}

export default function ComparePlansView({
  currentPlan,
  planModules,
  canChoose = false,
  canChooseCustom = false,
  allowRenewCurrent = false,
  allowDowngrade = true,
  onChoosePlan,
}: ComparePlansViewProps) {
  const { planRates } = useRevenue()
  const requestChoose = (tier: PlanTier) => {
    if (!onChoosePlan) return
    onChoosePlan(tier)
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="grid gap-2 p-px sm:grid-cols-2 lg:grid-cols-4">
        {STANDARD_TIERS.map((tier) => {
          const isCurrent = currentPlan === tier
          const isUpgrade = Boolean(currentPlan && currentPlan !== "CUSTOM" && isHigherTier(tier, currentPlan))
          const isDowngrade = Boolean(currentPlan && currentPlan !== "CUSTOM" && isLowerTier(tier, currentPlan))
          const count = planModules[tier]?.length ?? 0
          const selectable = Boolean(
            canChoose &&
              onChoosePlan &&
              (!isCurrent || allowRenewCurrent) &&
              (!isDowngrade || allowDowngrade)
          )
          const actionLabel = isCurrent ? "Renew" : isDowngrade ? "Downgrade" : isUpgrade ? "Upgrade" : "Select"

          return (
            <div
              key={tier}
              className={`flex flex-col rounded-lg p-3 text-left ${
                isCurrent
                  ? "border-2 border-(--yoco-primary) bg-(--yoco-row-hover)"
                  : "border border-(--yoco-border-subtle)"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${PLAN_COLORS[tier].dotClass}`} />
                  <span className="text-sm font-semibold">{planLabel(tier)}</span>
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-(--yoco-primary) px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xl font-semibold tracking-tight">
                {formatRate(planRates[tier])}
                <span className="ml-1 text-xs font-medium text-(--yoco-text-muted)">/seat/mo</span>
              </p>
              <p className="mt-0.5 text-xs text-(--yoco-text-muted)">{count} modules included</p>
              <div className="mt-auto pt-2">
                <Button
                  title={actionLabel}
                  onClick={() => requestChoose(tier)}
                  disabled={!selectable}
                  className="!h-8 w-full justify-center !px-2 !text-sm"
                />
              </div>
            </div>
          )
        })}

        {(() => {
          const isCurrent = currentPlan === "CUSTOM"
          const selectable = Boolean(onChoosePlan && (canChoose || canChooseCustom))

          return (
            <div
              className={`flex flex-col rounded-lg p-3 text-left ${
                isCurrent
                  ? "border-2 border-(--yoco-primary) bg-(--yoco-row-hover)"
                  : "border border-(--yoco-border-subtle)"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${PLAN_COLORS.CUSTOM.dotClass}`} />
                  <span className="text-sm font-semibold">Custom</span>
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-(--yoco-primary) px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-semibold leading-snug">Build a Custom plan</p>
              <p className="mt-0.5 text-xs text-(--yoco-text-muted)">Choose individual modules.</p>
              <div className="mt-auto pt-2">
                <Button
                  title={isCurrent ? "Edit" : "Build"}
                  onClick={() => requestChoose("CUSTOM")}
                  disabled={!selectable}
                  className="!h-8 w-full justify-center !px-2 !text-sm"
                />
              </div>
            </div>
          )
        })()}
      </div>

      <div className="overflow-x-auto rounded-lg border border-(--yoco-border-subtle)">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-(--yoco-border-subtle) bg-(--yoco-surface-muted)/50">
              <th className="px-3 py-1.5 text-left text-sm font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
                Module
              </th>
              {STANDARD_TIERS.map((tier) => (
                <th
                  key={tier}
                  className={`px-2 py-1.5 text-center text-sm font-semibold ${
                    currentPlan === tier ? "text-(--yoco-primary)" : ""
                  }`}
                >
                  {planLabel(tier)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULE_CATALOG.map((mod) => (
              <tr key={mod.key}>
                <td className="px-3 py-1.5">
                  <p className="font-medium">{mod.name}</p>
                </td>
                {STANDARD_TIERS.map((tier) => {
                  const included = (planModules[tier] ?? []).includes(mod.key)
                  return (
                    <td key={tier} className="px-2 py-1.5 text-center">
                      {included ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
                            <path
                              d="M3 8.2L6.4 11.6L13 4.4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="square"
                              strokeLinejoin="miter"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-(--yoco-text-muted)">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
