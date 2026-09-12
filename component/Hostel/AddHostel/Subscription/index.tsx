"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_CATALOG, MODULE_PILL_CURRENT, PLAN_COLORS, TIER_ORDER } from "@/lib/revenue/constants"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import {
  billedRateFor,
  billingCycleLabel,
  calcARR,
  formatDate,
  formatINR,
  formatRate,
  isTrialSubscription,
  planLabel,
  subscriptionLifecycleCaption,
} from "@/lib/revenue/utils"
import type { BillingCycle, PlanTier } from "@/lib/revenue/types"
import type { HostelFormProps } from "../formTypes"
import BillingPeriodPicker from "./BillingPeriodPicker"
import dayjs from "dayjs"

const Subscription = ({ setValue, register, watch, errors, readOnly, hostelId }: HostelFormProps) => {
  const { planModules, planRates, customModuleRates, settings, getHostel } = useRevenue()
  const currentSub = hostelId ? getHostel(hostelId) : undefined
  const plan = (watch("subscriptionPlan") ?? "ELITE") as PlanTier
  const count = Number(watch("subscriptionStudentCount") ?? 50)
  const trial = Boolean(watch("subscriptionTrial"))
  const cycle = watch("subscriptionBillingCycle") as BillingCycle | undefined
  const start = watch("subscriptionStartDate") ?? ""
  const renewal = watch("subscriptionRenewalDate") ?? ""
  const selectedModules = (watch("subscriptionModules") ?? []) as string[]
  const annual = trial ? 0 : calcARR(count, billedRateFor(plan, selectedModules, { planRates, customModuleRates, planModules }), "active")
  const planIncluded = new Set(plan === "CUSTOM" ? selectedModules : (planModules[plan] ?? []))
  const selectedSet = new Set(selectedModules)

  useEffect(() => {
    if (readOnly) return
    if (plan !== "CUSTOM" && selectedModules.length === 0) {
      setValue("subscriptionModules", planModules[plan], { shouldValidate: true })
    }
  }, [plan, planModules, readOnly, selectedModules.length, setValue])

  if (readOnly) {
    const caption = currentSub
      ? subscriptionLifecycleCaption(currentSub, settings.defaultGraceDays)
      : { label: trial ? "Trial" : "—", className: "text-(--yoco-text-muted)" }
    return (
      <div className="yoco-form-section w-full p-4 sm:p-6">
        <p className="yoco-form-title mb-4">Subscription</p>
        <p className="mb-4 text-sm text-(--yoco-text-muted)">
          Subscription cannot be changed from Edit Hostel.
          {hostelId ? (
            <>
              {" "}
              Manage it from{" "}
              <Link href={`/revenue/hostels/${hostelId}`} className="font-semibold text-(--yoco-primary) underline">
                Revenue
              </Link>
              .
            </>
          ) : (
            " Manage it from Revenue."
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Plan</p>
            <div className="mt-1 flex flex-col items-start gap-0.5">
              <PlanBadge plan={plan} trial={currentSub ? isTrialSubscription(currentSub) : trial} />
              <span className={`text-[10px] font-medium ${caption.className}`}>{caption.label}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Seat count (Students)</p>
            <p className="mt-1 text-sm font-semibold">{count}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
              Seat count (Staff) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              className="yoco-form-input-field px-3 py-2"
              {...register("staffCount", { valueAsNumber: true })}
            />
            {errors.staffCount ? (
              <p className="text-xs font-semibold text-rose-500">{errors.staffCount.message}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Billing period</p>
            <p className="mt-1 text-sm font-semibold">
              {formatDate(start)} – {formatDate(renewal)}
            </p>
            {currentSub?.billingCycle ? (
              <p className="text-xs text-(--yoco-text-muted)">{billingCycleLabel(currentSub.billingCycle)}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Trial</p>
            <p className="mt-1 text-sm font-semibold">{trial ? "On" : "Off"}</p>
          </div>
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Included modules</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(currentSub?.activeModules ?? selectedModules).map((key) => {
            const mod = MODULE_CATALOG.find((m) => m.key === key)
            return (
              <span key={key} className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${MODULE_PILL_CURRENT}`}>
                {mod?.name ?? key}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Subscription</p>

      <div className="flex w-full flex-col gap-5">
        <div>
          <label className="yoco-form-label mb-2 block">Plan</label>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {TIER_ORDER.map((tier) => {
              const selected = plan === tier
              return (
                <button
                  key={tier}
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    if (readOnly) return
                    setValue("subscriptionPlan", tier, { shouldValidate: true })
                    if (tier !== "CUSTOM") {
                      setValue("subscriptionModules", planModules[tier], { shouldValidate: true })
                    }
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-left transition-all ${
                    selected
                      ? "border-(--yoco-primary) bg-(--yoco-row-hover) ring-1 ring-(--yoco-primary)"
                      : "border-(--yoco-border-subtle) hover:border-(--yoco-border)"
                  } ${readOnly ? "cursor-not-allowed" : ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${PLAN_COLORS[tier].dotClass}`} />
                    <span className="text-xs font-semibold">{planLabel(tier)}</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-(--yoco-text-muted)">
                    {tier === "CUSTOM"
                      ? `From selected modules · ${formatRate(billedRateFor("CUSTOM", selectedModules, { planRates, customModuleRates, planModules }))}/mo/seat`
                      : `${formatRate(planRates[tier])}/mo/seat`}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.subscriptionPlan ? (
            <p className="mt-1 text-xs text-rose-500">{errors.subscriptionPlan.message}</p>
          ) : null}
        </div>

        <div>
          <p className="yoco-form-label mb-1.5 block">Included modules</p>
          <div className="flex flex-wrap gap-2">
            {MODULE_CATALOG.map((mod) => {
              const on = selectedSet.has(mod.key)
              const inPlan = planIncluded.has(mod.key)
              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => {
                    const next = on
                      ? selectedModules.filter((k) => k !== mod.key)
                      : [...selectedModules, mod.key]
                    setValue("subscriptionModules", next, { shouldValidate: true })
                  }}
                  className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                    on
                      ? MODULE_PILL_CURRENT
                      : "bg-(--yoco-surface-muted) text-(--yoco-text-muted) opacity-45"
                  } ${!inPlan && !on ? "" : ""}`}
                >
                  {mod.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">Trial period</label>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return
                const next = !trial
                setValue("subscriptionTrial", next, { shouldValidate: true })
                if (next) {
                  const nextStart = dayjs().format("YYYY-MM-DD")
                  setValue("subscriptionStartDate", nextStart, { shouldValidate: true })
                  setValue(
                    "subscriptionRenewalDate",
                    dayjs(nextStart).add(settings.defaultTrialDays, "day").format("YYYY-MM-DD"),
                    { shouldValidate: true }
                  )
                  setValue("subscriptionBillingCycle", undefined, { shouldValidate: true })
                } else {
                  setValue("subscriptionStartDate", "", { shouldValidate: true })
                  setValue("subscriptionRenewalDate", "", { shouldValidate: true })
                  setValue("subscriptionBillingCycle", undefined, { shouldValidate: true })
                }
              }}
              className={`w-fit rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-all ${
                trial
                  ? "border-(--yoco-primary) bg-(--yoco-row-hover) ring-1 ring-(--yoco-primary)"
                  : "border-(--yoco-border-subtle) hover:border-(--yoco-border)"
              } ${readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              {`${settings.defaultTrialDays} days`}
              <span className="mt-0.5 block text-[11px] font-medium text-(--yoco-text-muted)">
                {trial ? "On · ₹0 invoice" : "Off"}
              </span>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">
              Billing period <span className="text-rose-500">*</span>
            </label>
            <BillingPeriodPicker
              start={start}
              end={renewal}
              cycle={cycle}
              disabled={readOnly}
              onChange={(nextStart, nextEnd, nextCycle) => {
                if (readOnly) return
                setValue("subscriptionStartDate", nextStart, { shouldValidate: true })
                setValue("subscriptionRenewalDate", nextEnd, { shouldValidate: true })
                setValue("subscriptionBillingCycle", nextCycle || undefined, { shouldValidate: true })
              }}
            />
            {errors.subscriptionStartDate || errors.subscriptionRenewalDate || errors.subscriptionBillingCycle ? (
              <p className="text-xs font-semibold text-rose-500">
                {errors.subscriptionBillingCycle?.message ??
                  errors.subscriptionStartDate?.message ??
                  errors.subscriptionRenewalDate?.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">
              Seat count (Students) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              disabled={readOnly}
              className="yoco-form-input-field px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
              {...register("subscriptionStudentCount", { valueAsNumber: true })}
            />
            <p className="text-xs text-(--yoco-text-muted)">
              Annual value {formatINR(annual)}
              {trial ? " · trial" : ""}
            </p>
            {errors.subscriptionStudentCount ? (
              <p className="text-xs font-semibold text-rose-500">{errors.subscriptionStudentCount.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">
              Seat count (Staff) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              className="yoco-form-input-field px-3 py-2"
              {...register("staffCount", { valueAsNumber: true })}
            />
            {errors.staffCount ? (
              <p className="text-xs font-semibold text-rose-500">{errors.staffCount.message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Subscription
