"use client"

import type { ReactNode } from "react"
import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import StatusBadge from "@/component/Revenue/Shared/StatusBadge"
import { MODULE_CATALOG } from "@/lib/revenue/constants"
import { billingCycleLabel, formatDate, requestTypeLabel } from "@/lib/revenue/utils"
import type { HostelSubscription, PendingRequest, RevenueViewerRole } from "@/lib/revenue/types"

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">{label}</div>
      <div className="mt-1 min-w-0 text-sm font-semibold break-words text-(--yoco-text)">{children}</div>
    </div>
  )
}

function moduleNames(keys?: string[]) {
  if (!keys?.length) return "—"
  return keys.map((key) => MODULE_CATALOG.find((m) => m.key === key)?.name ?? key).join(", ")
}

function periodRange(start?: string | null, end?: string | null) {
  if (!start || !end) return "—"
  return `${formatDate(start)} – ${formatDate(end)}`
}

function upgradeRequestPeriod(request: PendingRequest, hostel: HostelSubscription) {
  if (request.subscriptionStartDate && request.renewalDate) {
    return periodRange(request.subscriptionStartDate, request.renewalDate)
  }
  return periodRange(request.submittedOn, hostel.renewalDate)
}

function BillingPeriodFields({ request, hostel }: { request: PendingRequest; hostel: HostelSubscription }) {
  return (
    <>
      <Field label="Original plan billing period">
        {periodRange(hostel.subscriptionStartDate, hostel.renewalDate)}
      </Field>
      <Field label="Requested plan billing period">{upgradeRequestPeriod(request, hostel)}</Field>
    </>
  )
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
    <Modal open={open} setOpen={(v) => !v && onClose()} width="5xl">
      <div className="min-w-0 overflow-x-hidden p-5">
        <p className="yoco-form-title">Request details</p>
        {request ? (
          <div className="mt-4 flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="UP REQ. ID">{request.requestNo}</Field>
              <Field label="Upgrade request status">
                <StatusBadge status={request.status} />
              </Field>
              <Field label="Request type">{requestTypeLabel(request.type)}</Field>
              <Field label="Requested by">
                {request.requestedBy} · {request.requestedByDesignation}
              </Field>
              <Field label="Requested on">{formatDate(request.submittedOn)}</Field>
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

const requestCardClass =
  "grid min-w-0 gap-4 overflow-hidden rounded-lg border border-(--yoco-border-subtle) px-4 py-3 sm:grid-cols-3"

function StudentBody({ request, hostel }: { request: PendingRequest; hostel: HostelSubscription }) {
  const add = request.requestedAddStudents ?? Math.max(0, (request.studentCount ?? hostel.studentCount) - hostel.studentCount)
  return (
    <div className={requestCardClass}>
      <Field label="Current plan">
        <PlanBadge plan={hostel.plan} />
      </Field>
      <Field label="Requested plan">
        <PlanBadge plan={hostel.plan} />
      </Field>
      <div />
      <Field label="Current billed seats">{hostel.studentCount}</Field>
      <Field label="Additional seats">{add}</Field>
      <Field label="New total billed seats">{hostel.studentCount + add}</Field>
      <BillingPeriodFields request={request} hostel={hostel} />
      <div />
    </div>
  )
}

function PlanBody({ request, hostel }: { request: PendingRequest; hostel: HostelSubscription }) {
  return (
    <div className={requestCardClass}>
      <Field label="Current plan">
        <PlanBadge plan={hostel.plan} />
      </Field>
      <Field label="Requested plan">
        <PlanBadge plan={request.planRequested ?? null} />
      </Field>
      <div />
      <Field label="Requested seats">{request.studentCount ?? hostel.studentCount}</Field>
      {request.billingCycle ? (
        <Field label="Requested billing cycle">{billingCycleLabel(request.billingCycle)}</Field>
      ) : (
        <div />
      )}
      <div />
      <BillingPeriodFields request={request} hostel={hostel} />
      <div />
    </div>
  )
}

function ModuleBody({ request, hostel }: { request: PendingRequest; hostel: HostelSubscription }) {
  const nextModules = request.modules?.length
    ? Array.from(new Set([...hostel.activeModules, ...request.modules]))
    : hostel.activeModules
  const extras = nextModules.filter((key) => !hostel.activeModules.includes(key))
  return (
    <div className={requestCardClass}>
      <Field label="Current plan">
        <PlanBadge plan={hostel.plan} />
      </Field>
      <Field label="Requested plan">
        <PlanBadge plan="CUSTOM" />
      </Field>
      <div />
      <Field label="Active modules">{moduleNames(hostel.activeModules)}</Field>
      <Field label="Requested modules">{moduleNames(nextModules)}</Field>
      <Field label="Added modules">{moduleNames(extras)}</Field>
      <BillingPeriodFields request={request} hostel={hostel} />
      {request.billingCycle ? (
        <Field label="Requested billing cycle">{billingCycleLabel(request.billingCycle)}</Field>
      ) : (
        <div />
      )}
    </div>
  )
}
