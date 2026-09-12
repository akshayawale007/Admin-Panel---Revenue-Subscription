"use client"

import { useState, type ReactNode } from "react"
import Button from "@/component/Common/Button/Button"
import ConfirmDialog from "@/component/Revenue/Shared/ConfirmDialog"
import PlanBadge from "@/component/Revenue/Shared/PlanBadge"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_CATALOG, MODULE_PILL_CURRENT } from "@/lib/revenue/constants"
import {
  formatDate,
  formatINR,
  isInactiveSubscription,
  isSubscriptionExpired,
  isTrialSubscription,
  subscriptionLifecycleCaption,
  upcomingChangeMessage,
} from "@/lib/revenue/utils"
import type { HostelSubscription } from "@/lib/revenue/types"

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">{label}</p>
      <div className="mt-1 text-sm font-semibold text-(--yoco-text)">{children}</div>
    </div>
  )
}

export default function OverviewTab({ hostel }: { hostel: HostelSubscription }) {
  const { updateHostel, addAudit, settings } = useRevenue()
  const graceDays = settings.defaultGraceDays
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const activated = hostel.activatedStudentCount ?? hostel.studentCount
  const added = hostel.addedStudentCount ?? Math.max(0, hostel.studentCount - activated)
  const planCaption = subscriptionLifecycleCaption(hostel, graceDays)
  const upcoming = upcomingChangeMessage(hostel)

  return (
    <div className="flex flex-col gap-6">
      {upcoming ? (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          {upcoming}
        </div>
      ) : null}
      {hostel.status === "deactivated" ? (
        <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          This subscription has been deactivated. Contact your admin to restore access.
        </div>
      ) : isSubscriptionExpired(hostel, graceDays) ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          This hostel&apos;s subscription has expired. Renew the current plan or upgrade to continue.
        </div>
      ) : null}
      <p className="text-sm font-semibold">Current subscription</p>

      <div className="flex flex-nowrap items-start gap-x-8 overflow-x-auto">
        <Fact label="Plan">
          <div className="flex flex-col items-start gap-0.5">
            <PlanBadge plan={hostel.plan} trial={isTrialSubscription(hostel)} />
            <span className={`text-[10px] font-medium leading-tight ${planCaption.className}`}>
              {planCaption.label}
            </span>
          </div>
        </Fact>
        <Fact label="Original seats">{activated}</Fact>
        <Fact label="Added seats">{added}</Fact>
        <Fact label="Total seats">{hostel.studentCount}</Fact>
        <Fact label="Billing Period">
          {formatDate(hostel.subscriptionStartDate)} – {formatDate(hostel.renewalDate)}
        </Fact>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
          Active modules ·{" "}
          {isInactiveSubscription(hostel, graceDays) ? 0 : hostel.activeModules.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {!isInactiveSubscription(hostel, graceDays) &&
            MODULE_CATALOG.filter((mod) => hostel.activeModules.includes(mod.key)).map((mod) => (
              <span
                key={mod.key}
                className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${MODULE_PILL_CURRENT}`}
              >
                {mod.name}
              </span>
            ))}
          {isInactiveSubscription(hostel, graceDays) || hostel.activeModules.length === 0 ? (
            <span className="text-sm text-(--yoco-text-muted)">No active modules</span>
          ) : null}
        </div>
      </div>

      {hostel.proRatedAdjustment ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          A pro-rated adjustment of {formatINR(hostel.proRatedAdjustment)} is scheduled for next renewal.
        </div>
      ) : null}

      {hostel.status !== "deactivated" ? (
        <div className="mt-2">
          <Button
            title="Deactivate"
            variant="secondary"
            className="bg-white text-red-800 hover:bg-red-50 hover:text-red-800"
            onClick={() => setDeactivateOpen(true)}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={deactivateOpen}
        setOpen={setDeactivateOpen}
        title={`Deactivate ${hostel.name}?`}
        description="Modules will be locked. The hostel can send an upgrade or renewal request to continue."
        confirmLabel="Deactivate"
        danger
        onConfirm={() => {
          updateHostel(hostel.hostelId, {
            status: "deactivated",
            activeModules: [],
            modulesLocked: true,
            annualValue: 0,
          })
          addAudit(hostel.hostelId, "Subscription deactivated")
        }}
      />
    </div>
  )
}
