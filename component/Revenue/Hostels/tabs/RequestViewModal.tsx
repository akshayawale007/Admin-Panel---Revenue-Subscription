"use client"

import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import StatusBadge from "@/component/Revenue/Shared/StatusBadge"
import { MODULE_CATALOG } from "@/lib/revenue/constants"
import { remainingFraction } from "@/lib/revenue/subscriptionBilling"
import { billedRateFor, billingCycleLabel, customPlanRateBreakdown, formatDate, formatRate, hostelRate, addedModulesRate, roundRate, isTrialSubscription, moduleByKey, planLabel, requestTypeLabel } from "@/lib/revenue/utils"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import type { HostelSubscription, PendingRequest, RevenueViewerRole } from "@/lib/revenue/types"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">{label}</p>
      <div className="mt-1 min-w-0 text-sm font-semibold break-words text-(--yoco-text)">{children}</div>
    </div>
  )
}

function moduleNames(keys?: string[]) {
  if (!keys?.length) return "—"
  return keys.map((key) => MODULE_CATALOG.find((m) => m.key === key)?.name ?? key).join(", ")
}

export default function RequestViewModal({
  open,
  onClose,
  request,
  hostel,
  viewerRole = "admin",
}: {
  open: boolean
  onClose: () => void
  request: PendingRequest | null
  hostel: HostelSubscription
  viewerRole?: RevenueViewerRole
}) {
  return (
    <Modal open={open} setOpen={(v) => !v && onClose()} width="lg">
      <div className="min-w-0 overflow-x-hidden p-5">
        <p className="yoco-form-title">Request details</p>
        {request ? (
          <div className="mt-4 flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Request ID">{request.requestNo}</Field>
              <Field label="Request type">{requestTypeLabel(request.type)}</Field>
              <Field label="Status">
                <StatusBadge status={request.status} />
              </Field>
              <Field label="Requested by">
                {request.requestedBy} · {request.requestedByDesignation}
              </Field>
              <Field label="Submitted">{formatDate(request.submittedOn)}</Field>
            </div>

            {request.type === "student_count_update" ? (
              <StudentBody request={request} hostel={hostel} />
            ) : request.type === "plan_upgrade" ||
              request.type === "plan_downgrade" ||
              request.type === "renewal_after_expiry" ||
              request.type === "new_subscription" ? (
              <PlanBody request={request} hostel={hostel} />
            ) : request.type === "module_add_remove" ? (
              <ModuleBody request={request} hostel={hostel} />
            ) : (
              <div className="rounded-lg border border-(--yoco-border-subtle) px-4 py-3 text-sm">
                <p>{request.details || "No additional details."}</p>
                {request.scheduledFor ? <p className="mt-2">Scheduled: {formatDate(request.scheduledFor)}</p> : null}
              </div>
            )}

            {request.details ? <Field label="Warden note">{request.details}</Field> : null}
            {request.rejectReason ? <Field label="Reject reason">{request.rejectReason}</Field> : null}
            {viewerRole === "admin" && request.adminHistory?.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">Admin history</p>
                <div className="mt-2 flex flex-col gap-2">
                  {request.adminHistory.map((event) => (
                    <div key={event.id} className="rounded-lg border border-(--yoco-border-subtle) px-3 py-2 text-sm">
                      <p className="font-semibold">
                        {event.action} · {event.by}
                      </p>
                      <p className="text-xs text-(--yoco-text-muted)">{formatDate(event.timestamp)}</p>
                      {event.note ? <p className="mt-1">{event.note}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end">
          <Button title="Close" variant="secondary" onClick={onClose} />
        </div>
      </div>
    </Modal>
  )
}

function StudentBody({ request, hostel }: { request: PendingRequest; hostel: HostelSubscription }) {
  const activated = hostel.activatedStudentCount ?? hostel.studentCount
  const add = request.requestedAddStudents ?? Math.max(0, (request.studentCount ?? hostel.studentCount) - hostel.studentCount)
  const { monthsLeft, inOriginalPeriod } = remainingFraction(hostel.renewalDate, hostel.billingCycle, {
    periodStart: hostel.subscriptionStartDate,
  })
  return (
    <div className="grid min-w-0 gap-4 overflow-hidden rounded-lg border border-(--yoco-border-subtle) px-4 py-3 sm:grid-cols-2">
      <Field label="Original seats">{activated}</Field>
      <Field label="Current billed">{hostel.studentCount}</Field>
      <Field label="Seats requested to add">{add}</Field>
      <Field label="New billed total">{hostel.studentCount + add}</Field>
      <Field label="Original plan billing period">
        {formatDate(hostel.subscriptionStartDate)} – {formatDate(hostel.renewalDate)}
      </Field>
      <Field label="Applies until original renewal">
        {inOriginalPeriod
          ? `${formatDate(hostel.renewalDate)} · ${monthsLeft} month${monthsLeft === 1 ? "" : "s"} left`
          : "Original period has ended — cannot apply mid-plan"}
      </Field>
    </div>
  )
}

function PlanBody({ request, hostel }: { request: PendingRequest; hostel: HostelSubscription }) {
  const { planRates, customModuleRates, planModules } = useRevenue()
  const pricing = { planRates, customModuleRates, planModules }
  const currentRate = hostelRate(hostel)
  const nextModules =
    request.planRequested === "CUSTOM" ? (request.modules ?? hostel.activeModules) : request.modules
  const nextRate = billedRateFor(request.planRequested ?? null, nextModules ?? hostel.activeModules, pricing)
  return (
    <div className="grid min-w-0 gap-4 overflow-hidden rounded-lg border border-(--yoco-border-subtle) px-4 py-3 sm:grid-cols-2">
      <Field label="Current plan">
        <span className="flex min-w-0 flex-col items-start gap-1">
          <PlanBadge plan={hostel.plan} trial={isTrialSubscription(hostel)} />
          <span className="text-xs font-medium text-(--yoco-text-muted)">{formatRate(currentRate)}/seat/month</span>
        </span>
      </Field>
      <Field label="Requested plan">
        <span className="flex min-w-0 flex-col items-start gap-1">
          <PlanBadge plan={request.planRequested ?? null} />
          <span className="text-xs font-medium text-(--yoco-text-muted)">{formatRate(nextRate)}/seat/month</span>
        </span>
      </Field>
      <Field label="Rate difference">{formatRate(nextRate - currentRate)}/seat/month</Field>
      <Field label="Requested seats">{request.studentCount ?? hostel.studentCount}</Field>
      <Field label="Difference applies to">{hostel.studentCount} billed seats</Field>
      {request.billingCycle ? <Field label="Requested billing cycle">{billingCycleLabel(request.billingCycle)}</Field> : null}
      {request.subscriptionStartDate && request.renewalDate ? (
        <Field label="Requested billing period">
          {formatDate(request.subscriptionStartDate)} – {formatDate(request.renewalDate)}
        </Field>
      ) : null}
    </div>
  )
}

function ModuleBody({ request, hostel }: { request: PendingRequest; hostel: HostelSubscription }) {
  const { planRates, customModuleRates, planModules } = useRevenue()
  const pricing = { planRates, customModuleRates, planModules }
  const nextModules = request.modules?.length
    ? Array.from(new Set([...hostel.activeModules, ...request.modules]))
    : hostel.activeModules
  const extras = nextModules.filter((key) => !hostel.activeModules.includes(key))
  const currentRate = hostelRate(hostel)
  const newPeriod = Boolean(request.subscriptionStartDate && request.renewalDate)
  const nextRate = newPeriod
    ? billedRateFor("CUSTOM", nextModules, pricing)
    : roundRate(currentRate + addedModulesRate(extras, pricing))
  const breakdown = customPlanRateBreakdown(nextModules, pricing)
  return (
    <div className="grid min-w-0 gap-4 overflow-hidden rounded-lg border border-(--yoco-border-subtle) px-4 py-3 sm:grid-cols-2">
      <Field label="Active modules">{moduleNames(hostel.activeModules)}</Field>
      <Field label="Requested modules">{moduleNames(nextModules)}</Field>
      <Field label="Added modules">{moduleNames(extras)}</Field>
      <Field label="Resulting plan">Custom</Field>
      <Field label="Current rate">{formatRate(currentRate)}/seat/month</Field>
      <Field label="Custom rate">{formatRate(nextRate)}/seat/month</Field>
      {newPeriod && breakdown.baseRate ? (
        <Field label="Base package">{formatRate(breakdown.baseRate)}/seat/month</Field>
      ) : null}
      {(newPeriod ? breakdown.extras : extras.map((key) => ({ key, rate: pricing.customModuleRates[key] ?? 0 }))).map(
        (line) => (
        <Field key={line.key} label={moduleByKey(line.key)?.name ?? line.key}>
          {formatRate(line.rate)}/seat/month
        </Field>
      )
      )}
      {request.billingCycle ? <Field label="Requested billing cycle">{billingCycleLabel(request.billingCycle)}</Field> : null}
      {request.subscriptionStartDate && request.renewalDate ? (
        <Field label="Requested billing period">
          {formatDate(request.subscriptionStartDate)} – {formatDate(request.renewalDate)}
        </Field>
      ) : null}
    </div>
  )
}
