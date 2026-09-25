"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_CATALOG, MODULE_PILL_CURRENT, PLAN_COLORS, TIER_ORDER } from "@/lib/revenue/constants"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import InvoicePreviewModal from "@/component/Revenue/Shared/InvoicePreviewModal"
import Button from "@/component/Common/Button/Button"
import {
  billedRateFor,
  billingCycleLabel,
  calcARR,
  calcPeriodValue,
  defaultInvoiceDueDate,
  formatDate,
  formatINR,
  formatRate,
  invoiceTotalsFromGross,
  isTrialSubscription,
  periodMonthsFromDates,
  planLabel,
  subscriptionLifecycleCaption,
} from "@/lib/revenue/utils"
import type { BillingCycle, HostelSubscription, Invoice, PlanTier } from "@/lib/revenue/types"
import type { HostelFormProps } from "../formTypes"
import BillingPeriodPicker from "./BillingPeriodPicker"
import ToggleSwitch from "@/component/Common/Toggle/Toggle"
import dayjs from "dayjs"

const FORM_TRIAL_DAYS = 30

const Subscription = ({ setValue, register, watch, errors, readOnly, hostelId }: HostelFormProps) => {
  const { planModules, planRates, customModuleRates, settings, getHostel } = useRevenue()
  const currentSub = hostelId ? getHostel(hostelId) : undefined
  const plan = (watch("subscriptionPlan") ?? "ELITE") as PlanTier
  const count = Number(watch("subscriptionStudentCount") ?? 50)
  const trial = Boolean(watch("subscriptionTrial"))
  const trialDays = Math.max(0, Math.floor(Number(watch("subscriptionTrialDays")) || 0))
  const cycle = watch("subscriptionBillingCycle") as BillingCycle | undefined
  const start = watch("subscriptionStartDate") ?? ""
  const renewal = watch("subscriptionRenewalDate") ?? ""
  const selectedModules = (watch("subscriptionModules") ?? []) as string[]
  const annual = trial ? 0 : calcARR(count, billedRateFor(plan, selectedModules, { planRates, customModuleRates, planModules }), "active")
  const planIncluded = new Set(plan === "CUSTOM" ? selectedModules : (planModules[plan] ?? []))
  const selectedSet = new Set(selectedModules)
  const [previewOpen, setPreviewOpen] = useState(false)
  const hostelName = watch("hostelName") || "New hostel"
  const cityValue = watch("city")
  const stateValue = watch("state")
  const cityLabel = cityValue?.name || cityValue?.label || ""
  const stateLabel = stateValue?.name || stateValue?.label || ""
  const periodReady = Boolean(start && renewal && dayjs(renewal).isAfter(dayjs(start), "day") && count >= 1)
  const canPreview = periodReady && (!trial || trialDays >= 1)

  const preview = useMemo(() => {
    const rate = trial ? 0 : billedRateFor(plan, selectedModules, { planRates, customModuleRates, planModules })
    const gross = trial || !periodReady ? 0 : calcPeriodValue(count, rate, periodMonthsFromDates(start, renewal), "active")
    const totals = invoiceTotalsFromGross({
      gross,
      sameState: true,
      gstRate: settings.gstRate,
      cgstRate: settings.cgstRate,
      sgstRate: settings.sgstRate,
    })
    const generated = dayjs().format("YYYY-MM-DD")
    const invoice: Invoice = {
      id: "preview",
      invoiceNo: "Assigned on save",
      upgradeRequestNo: "Assigned on save",
      billingPeriodStart: start,
      billingPeriodEnd: renewal,
      students: count,
      amount: totals.taxable,
      gst: totals.gst,
      total: totals.total,
      status: trial ? "paid" : "unpaid",
      dateGenerated: generated,
      sameState: true,
      dueDate: defaultInvoiceDueDate(generated),
      modules: selectedModules,
      plan,
      rate,
      invoiceType: "annual_subscription",
      billingCycle: cycle || undefined,
    }
    const hostel = {
      name: hostelName,
      city: cityLabel,
      state: stateLabel,
      hostelCode: watch("hostelCode") || "—",
      adminName: hostelName,
      adminPhone: watch("contact1") || "—",
    } as HostelSubscription
    return { invoice, hostel }
  }, [
    cityLabel,
    count,
    customModuleRates,
    cycle,
    hostelName,
    periodReady,
    plan,
    planModules,
    planRates,
    renewal,
    selectedModules,
    settings.cgstRate,
    settings.gstRate,
    settings.sgstRate,
    start,
    stateLabel,
    trial,
    watch,
  ])

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

        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <div className="flex h-6 items-center gap-3">
            <label className="yoco-form-label font-normal">Trial period</label>
            <div className={readOnly ? "pointer-events-none opacity-70" : ""}>
                <ToggleSwitch
                  compact
                  enabled={trial}
                onChange={(next) => {
                  if (readOnly) return
                  setValue("subscriptionTrial", next, { shouldValidate: true })
                  if (next) {
                    const days = trialDays > 0 ? trialDays : FORM_TRIAL_DAYS
                    const nextStart = dayjs().format("YYYY-MM-DD")
                    setValue("subscriptionTrialDays", days, { shouldValidate: true })
                    setValue("subscriptionStartDate", nextStart, { shouldValidate: true })
                    setValue(
                      "subscriptionRenewalDate",
                      dayjs(nextStart).add(days, "day").format("YYYY-MM-DD"),
                      { shouldValidate: true }
                    )
                    setValue("subscriptionBillingCycle", undefined, { shouldValidate: true })
                  } else {
                    const nextStart = dayjs().format("YYYY-MM-DD")
                    setValue("subscriptionTrialDays", undefined, { shouldValidate: true })
                    setValue("subscriptionStartDate", nextStart, { shouldValidate: true })
                    setValue(
                      "subscriptionRenewalDate",
                      dayjs(nextStart).add(1, "month").format("YYYY-MM-DD"),
                      { shouldValidate: true }
                    )
                    setValue("subscriptionBillingCycle", undefined, { shouldValidate: true })
                  }
                }}
              />
            </div>
          </div>
          <label className="yoco-form-label flex h-6 items-center font-normal">
            Billing period <span className="text-rose-500">*</span>
          </label>
          <div>
            <input
              type="number"
              min={1}
              step={1}
              aria-label="Trial days"
              disabled={readOnly || !trial}
              className="yoco-form-input-field !h-10 !w-[58%] px-3 py-0 disabled:cursor-not-allowed disabled:opacity-70"
              value={trial ? trialDays || "" : ""}
              onChange={(event) => {
                const days = Math.max(0, Math.floor(Number(event.target.value) || 0))
                setValue("subscriptionTrialDays", days || undefined, { shouldValidate: true })
                if (days > 0 && start) {
                  setValue(
                    "subscriptionRenewalDate",
                    dayjs(start).add(days, "day").format("YYYY-MM-DD"),
                    { shouldValidate: true }
                  )
                }
              }}
            />
            {errors.subscriptionTrialDays ? (
              <p className="mt-1 text-xs font-semibold text-rose-500">{errors.subscriptionTrialDays.message}</p>
            ) : null}
          </div>
          <div>
            <BillingPeriodPicker
              className="!h-10 !w-[58%]"
              start={start}
              end={renewal}
              cycle={cycle}
              disabled={readOnly}
              lockedDurationDays={trial && trialDays > 0 ? trialDays : undefined}
              minDate={trial && trialDays > 0 ? dayjs().format("YYYY-MM-DD") : undefined}
              onChange={(nextStart, nextEnd, nextCycle) => {
                if (readOnly) return
                setValue("subscriptionStartDate", nextStart, { shouldValidate: true })
                setValue("subscriptionRenewalDate", nextEnd, { shouldValidate: true })
                setValue("subscriptionBillingCycle", nextCycle || undefined, { shouldValidate: true })
              }}
            />
            {errors.subscriptionStartDate || errors.subscriptionRenewalDate || errors.subscriptionBillingCycle ? (
              <p className="mt-1 text-xs font-semibold text-rose-500">
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
              className="yoco-form-input-field !h-10 !w-[58%] px-3 py-0 disabled:cursor-not-allowed disabled:opacity-70"
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
              className="yoco-form-input-field !h-10 !w-[58%] px-3 py-0"
              {...register("staffCount", { valueAsNumber: true })}
            />
            {errors.staffCount ? (
              <p className="text-xs font-semibold text-rose-500">{errors.staffCount.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end">
          <Button title="View invoice" variant="secondary" disabled={!canPreview} onClick={() => setPreviewOpen(true)} />
        </div>
      </div>
      <InvoicePreviewModal
        open={previewOpen}
        setOpen={setPreviewOpen}
        invoice={preview.invoice}
        hostel={preview.hostel}
        settings={settings}
      />
    </div>
  )
}

export default Subscription
