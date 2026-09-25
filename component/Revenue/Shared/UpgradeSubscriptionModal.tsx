"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import dayjs from "dayjs"
import Button from "@/component/Common/Button/Button"
import Modal from "@/component/Common/Modal/Modal"
import BillingPeriodPicker from "@/component/Hostel/AddHostel/Subscription/BillingPeriodPicker"
import InvoicePreview from "@/component/Revenue/Shared/InvoicePreview"
import ModulePickGrid from "@/component/Revenue/Shared/ModulePickGrid"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_CATALOG, MODULE_PILL_CURRENT, MODULE_PILL_NEW, PLAN_COLORS, STANDARD_TIERS } from "@/lib/revenue/constants"
import {
  planUpgradeCharge,
  remainingFraction,
  studentAddCharge,
} from "@/lib/revenue/subscriptionBilling"
import {
  billedRateFor,
  billingCycleLabel,
  calcPeriodValue,
  customPlanRateBreakdown,
  formatDate,
  formatINR,
  formatRate,
  gstBreakdown,
  hostelRate,
  addedModulesRate,
  periodMonthsFromDates,
  roundRate,
  isHigherTier,
  isInGracePeriod,
  isLowerTier,
  isStandardTier,
  isSubscriptionExpired,
  isTrialSubscription,
  moduleByKey,
  packagedUpgradeOptions,
  planLabel,
  subscriptionAccessEndDate,
  subscriptionLifecycleCaption,
} from "@/lib/revenue/utils"
import type { BillingCycle, HostelSubscription, PlanTier } from "@/lib/revenue/types"

export type UpgradeKind = "students" | "plan" | "modules"

export const UPGRADE_KIND_COPY: Record<UpgradeKind, { title: string; blurb: string }> = {
  students: {
    title: "Change seats",
    blurb: "Increase the billed seat total for this hostel.",
  },
  plan: {
    title: "Change subscription plan",
    blurb: "Upgrade, downgrade, renew, or switch to any plan including Custom.",
  },
  modules: {
    title: "Custom module package",
    blurb: "Add modules. Current modules stay included. Billed as a Custom plan.",
  },
}

const STEPS = ["Choose", "Configure", "Review"] as const
const LAST_STEP = STEPS.length - 1

type Props = {
  open: boolean
  onClose: () => void
  hostel: HostelSubscription
  mode: "admin" | "warden"
  initialKind?: UpgradeKind | null
  initialPlan?: PlanTier | ""
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">{label}</p>
      <div className="mt-0.5 text-sm font-semibold text-(--yoco-text)">{children}</div>
    </div>
  )
}

function BillingPeriodFields({
  billingCycle,
  cycleStart,
  cycleEnd,
  onChange,
}: {
  billingCycle: BillingCycle | ""
  cycleStart: string
  cycleEnd: string
  onChange: (start: string, end: string, cycle?: BillingCycle | "") => void
}) {
  return (
    <div className="mt-1">
      <p className="text-sm font-semibold">Billing period</p>
      <p className="mt-1 text-xs text-(--yoco-text-muted)">
        Pick a start date, then an end date. Quarterly, Semiannual, and Annual are shortcuts.
      </p>
      <div className="mt-3">
        <BillingPeriodPicker start={cycleStart} end={cycleEnd} cycle={billingCycle} onChange={onChange} />
      </div>
    </div>
  )
}

export default function UpgradeSubscriptionModal({
  open,
  onClose,
  hostel,
  mode,
  initialKind = null,
  initialPlan = "",
}: Props) {
  const { addPendingRequest, settings, planModules, planRates, customModuleRates } = useRevenue()
  const [step, setStep] = useState(0)
  const [kind, setKind] = useState<UpgradeKind | null>(null)
  const [plan, setPlan] = useState<PlanTier | "">("")
  const [studentTotal, setStudentTotal] = useState(String(hostel.studentCount))
  const [customModules, setCustomModules] = useState<string[]>(hostel.activeModules)
  const [note, setNote] = useState("")
  const [billingCycle, setBillingCycle] = useState<BillingCycle | "">("")
  const [cycleStart, setCycleStart] = useState("")
  const [cycleEnd, setCycleEnd] = useState("")
  const [startAsTrial, setStartAsTrial] = useState(false)
  const [trialDays, setTrialDays] = useState(30)
  const initKey = useRef<string | null>(null)

  const activated = hostel.activatedStudentCount ?? hostel.studentCount
  const added = hostel.addedStudentCount ?? Math.max(0, hostel.studentCount - activated)
  const graceDays = settings.defaultGraceDays
  const expired = isSubscriptionExpired(hostel, graceDays)
  const inGrace = isInGracePeriod(hostel, graceDays)
  const trial = hostel.status === "trial"
  const needsRenewal = expired || inGrace
  const deactivated = hostel.status === "deactivated"
  const seatChangeLocked = expired || deactivated
  const needsNewCycle = trial || needsRenewal || deactivated
  const inPeriodActive = hostel.status === "active" && !needsNewCycle
  const decreaseLocked = inPeriodActive || inGrace || trial
  const lockCurrentModules = inPeriodActive || inGrace || trial
  const planCaption = subscriptionLifecycleCaption(hostel, graceDays)
  const planOptions = inPeriodActive ? packagedUpgradeOptions(hostel.plan) : STANDARD_TIERS
  const allowedInitialPlan =
    initialPlan && isStandardTier(initialPlan) && (!inPeriodActive || planOptions.includes(initialPlan))
      ? initialPlan
      : ""
  const mergedModules = customModules.length ? customModules : hostel.activeModules

  const reset = () => {
    setStep(0)
    setKind(null)
    setPlan("")
    setStudentTotal(String(hostel.studentCount))
    setCustomModules(hostel.activeModules)
    setNote("")
    setBillingCycle("")
    setCycleStart("")
    setCycleEnd("")
    setStartAsTrial(false)
    setTrialDays(30)
  }

  useEffect(() => {
    if (!open) {
      initKey.current = null
      return
    }
    const nextPlan = initialPlan === "CUSTOM" ? "" : allowedInitialPlan
    const rawKind = initialPlan === "CUSTOM" ? "modules" : (initialKind ?? null)
    const nextKind = rawKind === "students" && seatChangeLocked ? null : rawKind
    const key = `${hostel.hostelId}:${nextKind ?? ""}:${nextPlan}`
    if (initKey.current === key) return
    initKey.current = key
    setKind(nextKind)
    setPlan(nextPlan)
    setStudentTotal(String(hostel.studentCount))
    setCustomModules(hostel.activeModules)
    setNote("")
    setBillingCycle("")
    setCycleStart("")
    setCycleEnd("")
    setStartAsTrial(false)
    setTrialDays(30)
    setStep(0)
  }, [open, hostel.hostelId, hostel.studentCount, hostel.activeModules, initialKind, initialPlan, allowedInitialPlan, seatChangeLocked])

  const selectKind = (next: UpgradeKind) => {
    if (next === "students" && seatChangeLocked) return
    if (next !== kind) {
      if (next !== "plan") setPlan("")
      setStudentTotal(String(hostel.studentCount))
      setStartAsTrial(false)
    }
    setKind(next)
  }

  const showBillingPeriod =
    kind === "modules" ? !lockCurrentModules && needsNewCycle && !startAsTrial : needsNewCycle && !startAsTrial
  const hasValidNewCycle =
    startAsTrial ||
    (Boolean(cycleStart) && Boolean(cycleEnd) && !dayjs(cycleEnd).isBefore(dayjs(cycleStart), "day"))

  const pricing = { planRates, customModuleRates, planModules }
  const nextStudentTotal = Math.max(1, Math.round(Number(studentTotal) || hostel.studentCount))
  const studentDelta = nextStudentTotal - hostel.studentCount
  const nextPlan = kind === "plan" && plan ? plan : hostel.plan
  const planUpgraded = Boolean(kind === "plan" && hostel.plan && nextPlan && isHigherTier(nextPlan, hostel.plan))
  const accessEnd = subscriptionAccessEndDate(hostel, graceDays).format("YYYY-MM-DD")
  const { monthsLeft, periodMonths, inOriginalPeriod } = remainingFraction(hostel.renewalDate, hostel.billingCycle, {
    accessEndDate: accessEnd,
    useAccessWindow: inGrace && kind === "modules",
    periodStart: hostel.subscriptionStartDate,
  })
  const planModulesForRate =
    kind === "modules"
      ? mergedModules
      : kind === "plan" && plan === "CUSTOM"
        ? customModules
        : kind === "plan" && plan
          ? (planModules[plan] ?? [])
          : hostel.activeModules
  const ratePlan = kind === "modules" || plan === "CUSTOM" ? "CUSTOM" : nextPlan
  const catalogNew = billedRateFor(ratePlan, planModulesForRate, pricing)
  const oldRate = hostelRate(hostel)
  const addedCustomModules = customModules.filter((key) => !hostel.activeModules.includes(key))
  const addedSum = addedModulesRate(addedCustomModules, pricing)
  const newRate =
    kind === "modules" && lockCurrentModules ? roundRate(oldRate + addedSum) : catalogNew
  const customBreakdown = customPlanRateBreakdown(planModulesForRate, pricing)
  const effectiveAdd = kind === "students" && inOriginalPeriod && studentDelta > 0 ? studentDelta : 0
  const studentCharge = studentAddCharge(effectiveAdd, oldRate, monthsLeft)
  const planCharge = planUpgraded && inOriginalPeriod && !needsNewCycle ? planUpgradeCharge(oldRate, newRate, nextStudentTotal, monthsLeft) : 0
  const moduleCharge =
    kind === "modules" && lockCurrentModules && !trial
      ? planUpgradeCharge(oldRate, newRate, nextStudentTotal, monthsLeft)
      : 0
  const cycleMonths = cycleStart && cycleEnd ? periodMonthsFromDates(cycleStart, cycleEnd) : 0
  const cycleCharge =
    kind === "plan" && plan && needsNewCycle && cycleMonths && !startAsTrial
      ? calcPeriodValue(nextStudentTotal, newRate, cycleMonths, "active")
      : kind === "modules" && showBillingPeriod && cycleMonths && !startAsTrial
        ? calcPeriodValue(nextStudentTotal, newRate, cycleMonths, "active")
        : 0
  const billedNow =
    startAsTrial || (trial && kind === "modules")
      ? 0
      : kind === "modules" && lockCurrentModules
        ? moduleCharge
        : needsNewCycle
          ? cycleCharge
          : planCharge
  const studentGst = gstBreakdown(studentCharge, true, settings.gstRate, settings)
  const planGst = gstBreakdown(billedNow, true, settings.gstRate, settings)
  const planAllowed = Boolean(
    plan &&
      (inPeriodActive
        ? plan === "CUSTOM" || (hostel.plan && isHigherTier(plan, hostel.plan))
        : plan !== hostel.plan || studentDelta !== 0 || needsNewCycle || startAsTrial)
  )

  const hasOpenRequest = hostel.pendingRequests.some((r) => r.status === "pending" || r.status === "on_hold")

  const hasValidChange =
    (kind === "students" && !seatChangeLocked && studentDelta > 0) ||
    (kind === "plan" && planAllowed && (inPeriodActive || hasValidNewCycle) && (!decreaseLocked || studentDelta >= 0)) ||
    (kind === "modules" &&
      customModules.length > 0 &&
      (lockCurrentModules ? addedCustomModules.length > 0 : hasValidNewCycle) &&
      (!decreaseLocked || studentDelta >= 0))

  const canAdvance = step === 0 ? Boolean(kind) && !(kind === "students" && seatChangeLocked) : hasValidChange
  const canConfirm = hasValidChange && !hasOpenRequest

  const close = () => {
    reset()
    onClose()
  }

  const goBack = () => setStep((prev) => Math.max(0, prev - 1))
  const goNext = () => {
    if (!canAdvance) return
    setStep((prev) => Math.min(LAST_STEP, prev + 1))
  }

  const onConfirm = () => {
    if (!canConfirm || !kind || hasOpenRequest) return
    const details = note.trim() || (mode === "admin" ? "Submitted from admin upgrade" : undefined)
    if (kind === "students") {
      if (seatChangeLocked || studentDelta < 0) return
      addPendingRequest(hostel.hostelId, {
        type: "student_count_update",
        requestedAddStudents: studentDelta > 0 ? studentDelta : undefined,
        studentCount: nextStudentTotal,
        details,
      })
    } else if (kind === "plan") {
      if (decreaseLocked && studentDelta < 0) return
      const samePlanRenewal = plan === hostel.plan && !startAsTrial
      const downgrade = Boolean(!inPeriodActive && plan && hostel.plan && isLowerTier(plan, hostel.plan))
      addPendingRequest(hostel.hostelId, {
        type: startAsTrial
          ? "new_subscription"
          : downgrade
            ? "plan_downgrade"
            : samePlanRenewal
              ? "renewal_after_expiry"
              : "plan_upgrade",
        planRequested: plan || undefined,
        studentCount: nextStudentTotal,
        details,
        billingCycle: startAsTrial || inPeriodActive ? undefined : billingCycle || undefined,
        subscriptionStartDate: startAsTrial || inPeriodActive ? undefined : cycleStart || undefined,
        renewalDate: startAsTrial || inPeriodActive ? undefined : cycleEnd || undefined,
        startTrial: startAsTrial || undefined,
        trialDays: startAsTrial ? Math.max(1, Math.floor(trialDays) || 30) : undefined,
      })
    } else {
      if (decreaseLocked && studentDelta < 0) return
      addPendingRequest(hostel.hostelId, {
        type: "module_add_remove",
        planRequested: "CUSTOM",
        modules: customModules,
        studentCount: nextStudentTotal,
        details,
        billingCycle: lockCurrentModules ? undefined : billingCycle || undefined,
        subscriptionStartDate: lockCurrentModules ? undefined : cycleStart || undefined,
        renewalDate: lockCurrentModules ? undefined : cycleEnd || undefined,
      })
    }
    close()
  }

  const gstPct = `${settings.gstRate}%`
  const moduleRateLabel = customModules.length ? `${formatRate(newRate)}/seat/mo` : "—"
  const cycleRange = cycleStart && cycleEnd ? `${formatDate(cycleStart)} – ${formatDate(cycleEnd)}` : "—"
  const currentRange = `${formatDate(hostel.subscriptionStartDate)} – ${formatDate(hostel.renewalDate)}`
  const invoiceTotals = {
    gst: formatINR(kind === "students" ? studentGst.gst : planGst.gst),
    total: formatINR(kind === "students" ? studentGst.total : planGst.total),
    subtotal: formatINR(kind === "students" ? studentCharge : billedNow),
  }

  const studentInvoice =
    studentDelta > 0 && inOriginalPeriod
      ? {
          title: "Plan",
          value: "Seat increase",
          meta: `${hostel.studentCount} → ${nextStudentTotal} seats · through ${formatDate(hostel.renewalDate)}`,
          highlights: [
            { label: "Rate", value: `${formatRate(oldRate)}`, hint: "Per seat / month (contracted)", tone: "rate" as const },
            { label: "Invoice total", value: invoiceTotals.total, hint: `Includes GST ${gstPct}`, tone: "total" as const },
          ],
          groups: [
            {
              title: "Seats",
              lines: [
                { label: "Current billed", value: String(hostel.studentCount) },
                { label: "Seats to add", value: String(studentDelta) },
                { label: "New total", value: String(nextStudentTotal), emphasis: true },
              ],
            },
            {
              title: "This invoice",
              lines: [
                { label: "Months left", value: `${monthsLeft} of ${periodMonths}` },
                { label: "Charge", value: invoiceTotals.subtotal, hint: `${studentDelta} × ${formatRate(oldRate)} × ${monthsLeft} mo` },
                { label: `GST (${gstPct})`, value: invoiceTotals.gst },
                { label: "Invoice total", value: invoiceTotals.total, emphasis: true },
              ],
            },
          ],
        }
      : {
          title: "Plan",
          value: "Seat change",
          meta: `${hostel.studentCount} → ${nextStudentTotal} seats`,
          highlights: [
            { label: "Rate", value: `${formatRate(oldRate)}`, hint: "Per seat / month (contracted)", tone: "rate" as const },
            { label: "Invoice total", value: formatINR(0), hint: `Takes effect ${formatDate(hostel.renewalDate)}`, tone: "total" as const },
          ],
          groups: [
            {
              title: "This invoice",
              lines: [
                { label: "Charge now", value: formatINR(0) },
                { label: "Takes effect", value: formatDate(hostel.renewalDate), emphasis: true },
              ],
            },
          ],
        }

  const planInvoice = {
    title: "Plan",
    meta: `${nextStudentTotal} seats · ${planLabel(hostel.plan)} → ${planLabel(nextPlan)}`,
    highlights: [
      { label: "New rate", value: formatRate(newRate), hint: "Per seat / month", tone: "rate" as const },
      {
        label: "Invoice total",
        value: startAsTrial ? formatINR(0) : invoiceTotals.total,
        hint: startAsTrial ? `${Math.max(1, Math.floor(trialDays) || 30)}-day trial · no charge` : `Includes GST ${gstPct}`,
        tone: "total" as const,
      },
    ],
    groups: [
      {
        title: "Rate",
        lines: [
          { label: "Current", value: `${planLabel(hostel.plan)} · ${formatRate(oldRate)}` },
          { label: "Requested", value: `${planLabel(nextPlan)} · ${formatRate(newRate)}`, emphasis: true },
        ],
      },
      {
        title: "This invoice",
        lines: startAsTrial
          ? [{ label: "Trial", value: `${Math.max(1, Math.floor(trialDays) || 30)} days`, hint: "₹0 until paid conversion" }]
          : inPeriodActive
            ? [
                { label: "Billing period", value: currentRange },
                { label: "Months left", value: `${monthsLeft} of ${periodMonths}` },
                {
                  label: "Charge",
                  value: invoiceTotals.subtotal,
                  hint: planCharge
                    ? `${nextStudentTotal} × ${formatRate(newRate - oldRate)} × ${monthsLeft} mo`
                    : undefined,
                },
                { label: `GST (${gstPct})`, value: invoiceTotals.gst },
                { label: "Invoice total", value: invoiceTotals.total, emphasis: true },
              ]
            : [
                ...(billingCycle
                  ? [{ label: "Billing cycle", value: billingCycleLabel(billingCycle) }]
                  : []),
                { label: "Billing period", value: cycleRange },
                {
                  label: "Charge",
                  value: invoiceTotals.subtotal,
                  hint: cycleCharge ? `${nextStudentTotal} × ${formatRate(newRate)} × ${cycleMonths} mo` : undefined,
                },
                { label: `GST (${gstPct})`, value: invoiceTotals.gst },
                { label: "Invoice total", value: invoiceTotals.total, emphasis: true },
              ],
      },
    ],
  }

  const moduleRateLines = lockCurrentModules
    ? [
        { label: "Contracted rate", value: formatRate(oldRate), hint: "Locked from the current plan" },
        ...addedCustomModules.map((key) => ({
          label: moduleByKey(key)?.name ?? key,
          value: formatRate(pricing.customModuleRates[key] ?? 0),
          hint: "Added module",
        })),
        { label: "Custom rate", value: formatRate(newRate), emphasis: true },
      ]
    : [
        ...(customBreakdown.basePlan
          ? [
              {
                label: `${planLabel(customBreakdown.basePlan)} package`,
                value: formatRate(customBreakdown.baseRate),
              },
            ]
          : []),
        ...customBreakdown.extras.map((line) => ({
          label: moduleByKey(line.key)?.name ?? line.key,
          value: formatRate(line.rate),
        })),
        { label: "Custom rate", value: formatRate(newRate), emphasis: true },
      ]

  const moduleInvoice = {
    title: "Plan",
    value: "Custom plan",
    meta: lockCurrentModules
      ? `${nextStudentTotal} seats · remaining access through ${formatDate(inGrace ? accessEnd : hostel.renewalDate)}`
      : `${nextStudentTotal} seats${billingCycle ? ` · ${billingCycleLabel(billingCycle)}` : ""} · ${cycleRange}`,
    highlights: [
      { label: "Custom rate", value: formatRate(newRate), hint: "Final billed rate for this custom plan", tone: "rate" as const },
      {
        label: "Invoice total",
        value: trial && lockCurrentModules ? formatINR(0) : invoiceTotals.total,
        hint: trial && lockCurrentModules ? "Billed when the paid cycle starts" : `Includes GST ${gstPct}`,
        tone: "total" as const,
      },
    ],
    groups: [
      { title: "Rate makeup", lines: moduleRateLines },
      {
        title: "This invoice",
        lines:
          trial && lockCurrentModules
            ? [{ label: "Charge now", value: formatINR(0), hint: "Modules apply during trial at ₹0" }]
            : lockCurrentModules
              ? [
                  { label: "Months billed", value: String(monthsLeft) },
                  {
                    label: "Charge",
                    value: invoiceTotals.subtotal,
                    hint: moduleCharge
                      ? `${nextStudentTotal} × ${formatRate(newRate - oldRate)} × ${monthsLeft} mo`
                      : undefined,
                  },
                  { label: `GST (${gstPct})`, value: invoiceTotals.gst },
                  { label: "Invoice total", value: invoiceTotals.total, emphasis: true },
                ]
              : [
                  ...(billingCycle
                    ? [{ label: "Billing cycle", value: billingCycleLabel(billingCycle) }]
                    : []),
                  { label: "Billing period", value: cycleRange },
                  {
                    label: "Charge",
                    value: invoiceTotals.subtotal,
                    hint: cycleCharge ? `${nextStudentTotal} × ${formatRate(newRate)} × ${cycleMonths} mo` : undefined,
                  },
                  { label: `GST (${gstPct})`, value: invoiceTotals.gst },
                  { label: "Invoice total", value: invoiceTotals.total, emphasis: true },
                ],
      },
    ],
  }

  return (
    <Modal open={open} setOpen={(v) => { if (!v) close() }} width="5xl" height="95vh">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Upgrade request</p>
            <p className="mt-0.5 text-sm text-(--yoco-text-muted)">
              {hostel.name} · {hostel.hostelCode}
            </p>
          </div>
          <div className="flex items-center gap-1.5" aria-label="Upgrade steps">
            {STEPS.map((label, index) => (
              <span
                key={label}
                title={label}
                className={`h-2.5 w-2.5 rounded-full ${
                  index === step
                    ? "bg-(--yoco-primary)"
                    : index < step
                      ? "bg-(--yoco-text)"
                      : "bg-(--yoco-border)"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Current plan</p>
          <div className="grid items-start gap-x-8 gap-y-3 md:grid-cols-2">
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2 text-sm">
            <Fact label="Plan">
              <div className="flex flex-col items-start gap-0.5">
                <PlanBadge plan={hostel.plan} trial={isTrialSubscription(hostel)} />
                <span className={`text-[10px] font-medium leading-tight ${planCaption.className}`}>
                  {planCaption.label}
                </span>
              </div>
            </Fact>
            <Fact label="Billing period">
              {formatDate(hostel.subscriptionStartDate)} – {formatDate(hostel.renewalDate)}
            </Fact>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Active modules</p>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              {!expired && hostel.activeModules.length ? (
                hostel.activeModules.map((key) => (
                  <span
                    key={key}
                    className={`inline-flex w-fit items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${MODULE_PILL_CURRENT}`}
                  >
                    {moduleByKey(key)?.name ?? key}
                  </span>
                ))
              ) : (
                <span className="text-xs text-(--yoco-text-muted)">No active modules</span>
              )}
            </div>
          </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {step === 0 ? (
            <div className="w-full">
              <section>
                <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                  <Fact label="Original seats">{activated}</Fact>
                  <Fact label="Added seats">{added}</Fact>
                  <Fact label="Current billed">{hostel.studentCount}</Fact>
                </div>
              </section>

              <section className="mt-5 border-t border-(--yoco-border-subtle) pt-5">
                <div className="grid gap-3 md:grid-cols-3">
                  {(Object.keys(UPGRADE_KIND_COPY) as UpgradeKind[]).map((option) => {
                    const selected = kind === option
                    const locked = option === "students" && seatChangeLocked
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={locked}
                        onClick={() => selectKind(option)}
                        className={`rounded-2xl border px-4 py-3.5 text-left transition-all ${
                          locked
                            ? "cursor-not-allowed border-(--yoco-border-subtle) bg-(--yoco-surface-muted) opacity-60"
                            : selected
                              ? "cursor-pointer border-(--yoco-border) bg-(--yoco-surface-muted) shadow-sm"
                              : "cursor-pointer border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) hover:border-(--yoco-border)"
                        }`}
                      >
                        <p className="text-sm font-semibold">{UPGRADE_KIND_COPY[option].title}</p>
                        <p className="mt-1 text-xs leading-snug text-(--yoco-text-muted)">
                          {locked
                            ? deactivated
                              ? "Seats cannot be changed on a deactivated subscription. Choose a plan first."
                              : "Seats cannot be changed on an expired subscription. Renew or upgrade the plan first."
                            : option === "plan" && inPeriodActive
                              ? "Upgrade to a higher plan. Billing stays on the current period. Downgrades are not allowed."
                              : UPGRADE_KIND_COPY[option].blurb}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>
            ) : null}

            {step === 1 ? (
            <div className="w-full">
              <section className="rounded-2xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) p-4 shadow-md">
                {kind === "students" ? (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Seat total</p>
                ) : null}

                {kind === "students" ? (
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="grid items-stretch gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-(--yoco-border-subtle) px-3 py-2">
                        <p className="text-[11px] text-(--yoco-text-muted)">Current billed</p>
                        <p className="text-lg font-semibold">{hostel.studentCount}</p>
                      </div>
                      <label className="rounded-xl border border-(--yoco-border-subtle) px-3 py-2">
                        <span className="text-[11px] text-(--yoco-text-muted)">New seat total</span>
                        <input
                          type="number"
                          min={1}
                          className="mt-0 block w-full border-0 bg-transparent p-0 text-lg font-semibold text-(--yoco-text) outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          value={studentTotal}
                          onChange={(e) => setStudentTotal(e.target.value)}
                        />
                      </label>
                    </div>
                    {decreaseLocked && studentDelta < 0 ? (
                      <p className="text-xs font-semibold text-rose-600">
                        New seat total cannot be lower than the current billed count ({hostel.studentCount}).
                      </p>
                    ) : (
                      <p className="text-xs text-(--yoco-text-muted)">
                        {studentDelta > 0 && inOriginalPeriod
                          ? `Added seats are billed until ${formatDate(hostel.renewalDate)}.`
                          : "Enter a different seat total."}
                      </p>
                    )}
                  </div>
                ) : null}

                {kind === "plan" ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold">Select a plan</p>
                    {inPeriodActive && !planOptions.length ? (
                      <p className="text-xs text-(--yoco-text-muted)">
                        This hostel is already on the highest packaged plan. Use a Custom module package to change
                        modules, or wait until the current period ends to renew.
                      </p>
                    ) : null}
                    <div className="grid items-stretch gap-3 sm:grid-cols-2">
                      {planOptions.map((tier) => {
                        const selected = plan === tier
                        const included = planModules[tier] ?? []
                        const isCurrentRenewal = tier === hostel.plan
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setPlan(tier)}
                            className={`flex h-full w-full flex-col items-stretch justify-start rounded-xl border-2 bg-(--yoco-surface-elevated) px-4 py-3 text-left ${
                              selected
                                ? "border-(--yoco-primary)"
                                : "border-(--yoco-border-subtle) hover:border-(--yoco-border)"
                            }`}
                          >
                            <span className="flex w-full items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${PLAN_COLORS[tier].dotClass}`} />
                                <span className="text-sm font-semibold">{planLabel(tier)}</span>
                              </span>
                              <span className="text-xs font-semibold">
                                {`${formatRate(planRates[tier])}/seat/mo`}
                              </span>
                            </span>
                            {hostel.plan ? (
                              <p className="mt-1 w-full text-xs text-(--yoco-text-muted)">
                                {isCurrentRenewal
                                  ? `${trial ? "Continue" : "Renew"} ${planLabel(tier)} at ${formatRate(planRates[tier])}/seat/mo.`
                                  : `From ${formatRate(oldRate)} to ${formatRate(planRates[tier])} per seat / month`}
                              </p>
                            ) : null}
                            <div className="mt-2 flex w-full flex-wrap gap-1.5">
                              {included.map((key) => {
                                const isNew = !hostel.activeModules.includes(key)
                                return (
                                  <span
                                    key={key}
                                    className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                      isNew ? MODULE_PILL_NEW : MODULE_PILL_CURRENT
                                    }`}
                                  >
                                    {moduleByKey(key)?.name ?? key}
                                    {isNew ? " · new" : ""}
                                  </span>
                                )
                              })}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <label className="rounded-xl border border-(--yoco-border-subtle) px-3 py-2">
                      <span className="text-[11px] text-(--yoco-text-muted)">Seats for this plan</span>
                      <input
                        type="number"
                        min={1}
                        className="mt-0 block w-full border-0 bg-transparent p-0 text-lg font-semibold text-(--yoco-text) outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        value={studentTotal}
                        onChange={(e) => setStudentTotal(e.target.value)}
                      />
                    </label>
                    {decreaseLocked && studentDelta < 0 ? (
                      <p className="text-xs font-semibold text-rose-600">
                        New seat total cannot be lower than the current billed count ({hostel.studentCount}).
                      </p>
                    ) : null}
                    {deactivated ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={startAsTrial}
                          onChange={(e) => setStartAsTrial(e.target.checked)}
                        />
                        Start as a trial
                      </label>
                    ) : null}
                    {deactivated && startAsTrial ? (
                      <label className="rounded-xl border border-(--yoco-border-subtle) px-3 py-2">
                        <span className="text-[11px] text-(--yoco-text-muted)">Trial days</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="mt-0 block w-full border-0 bg-transparent p-0 text-lg font-semibold text-(--yoco-text) outline-none"
                          value={trialDays}
                          onChange={(e) => setTrialDays(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                        />
                      </label>
                    ) : null}
                    {showBillingPeriod ? (
                      <BillingPeriodFields
                        billingCycle={billingCycle}
                        cycleStart={cycleStart}
                        cycleEnd={cycleEnd}
                        onChange={(start, end, nextCycle) => {
                          setCycleStart(start)
                          setCycleEnd(end)
                          if (nextCycle !== undefined) setBillingCycle(nextCycle)
                        }}
                      />
                    ) : inPeriodActive ? (
                      <p className="text-xs text-(--yoco-text-muted)">
                        This upgrade uses the current billing period ({formatDate(hostel.subscriptionStartDate)} –{" "}
                        {formatDate(hostel.renewalDate)}).
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {kind === "modules" ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold">Select modules</p>
                    <p className="text-xs text-(--yoco-text-muted)">
                      {lockCurrentModules
                        ? "Modules already on this hostel cannot be removed. Add any extra modules. The plan is billed as Custom."
                        : "Select modules for a Custom plan. Extra modules use custom rates; a full packaged set uses that package price."}
                      {customModules.length ? ` Current custom rate ${moduleRateLabel}.` : ""}
                    </p>
                    <ModulePickGrid
                      items={MODULE_CATALOG}
                      selected={customModules}
                      lockedKeys={lockCurrentModules ? hostel.activeModules : []}
                      onToggle={(key) =>
                        setCustomModules((prev) => {
                          if (lockCurrentModules && hostel.activeModules.includes(key) && prev.includes(key)) {
                            return prev
                          }
                          return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                        })
                      }
                    />
                    {showBillingPeriod ? (
                      <BillingPeriodFields
                        billingCycle={billingCycle}
                        cycleStart={cycleStart}
                        cycleEnd={cycleEnd}
                        onChange={(start, end, nextCycle) => {
                          setCycleStart(start)
                          setCycleEnd(end)
                          if (nextCycle !== undefined) setBillingCycle(nextCycle)
                        }}
                      />
                    ) : lockCurrentModules ? (
                      <p className="text-xs text-(--yoco-text-muted)">
                        {trial
                          ? "Added modules apply during trial at ₹0. Paid custom rates start on the next paid cycle."
                          : inGrace
                            ? `Added modules are billed for the remaining access window through ${formatDate(accessEnd)}.`
                            : `Custom modules apply to the current billing period (${formatDate(hostel.subscriptionStartDate)} – ${formatDate(hostel.renewalDate)}).`}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!kind ? (
                  <p className="mt-3 text-sm text-(--yoco-text-muted)">Go back and choose what you want to change.</p>
                ) : null}
              </section>
            </div>
            ) : null}

            {step === 2 ? (
            <div className="w-full">
              <section className="flex flex-col gap-4">
                {kind === "students" && studentDelta !== 0 ? (
                  <InvoicePreview
                    title={studentInvoice.title}
                    value={studentInvoice.value}
                    meta={studentInvoice.meta}
                    highlights={studentInvoice.highlights}
                    groups={studentInvoice.groups}
                  />
                ) : null}
                {kind === "plan" && plan ? (
                  <InvoicePreview
                    title={planInvoice.title}
                    meta={planInvoice.meta}
                    badge={<PlanBadge plan={nextPlan} trial={startAsTrial} />}
                    highlights={planInvoice.highlights}
                    groups={planInvoice.groups}
                  />
                ) : null}
                {kind === "modules" && customModules.length ? (
                  <InvoicePreview
                    title={moduleInvoice.title}
                    value={moduleInvoice.value}
                    meta={moduleInvoice.meta}
                    highlights={moduleInvoice.highlights}
                    groups={moduleInvoice.groups}
                  />
                ) : null}
                {hasOpenRequest ? (
                  <p className="text-sm text-rose-600">
                    This hostel already has an open request. Approve, reject, or withdraw it before submitting another
                    upgrade.
                  </p>
                ) : (
                  <p className="text-sm text-(--yoco-text-muted)">
                    {lockCurrentModules && (kind === "plan" || kind === "modules")
                      ? trial && kind === "modules"
                        ? "If approved, modules apply now with no invoice until a paid cycle starts."
                        : "If approved, the Custom plan applies on the current period. Only added modules are billed for the remaining window."
                      : "The current plan will not change until this request is approved."}
                  </p>
                )}
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
                    Note (optional)
                  </span>
                  <textarea
                    className="yoco-input min-h-20 px-3 py-2"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything the revenue team should know"
                  />
                </label>
              </section>
            </div>
            ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {step > 0 ? <Button title="Back" variant="secondary" onClick={goBack} /> : null}
          {step < LAST_STEP ? (
            <Button title="Next" onClick={goNext} disabled={!canAdvance} />
          ) : (
            <Button title="Submit request" onClick={onConfirm} disabled={!canConfirm} />
          )}
        </div>
      </div>
    </Modal>
  )
}
