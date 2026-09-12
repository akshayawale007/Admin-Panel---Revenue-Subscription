"use client"

import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_PILL_CURRENT, PLAN_COLORS } from "@/lib/revenue/constants"
import { remainingFraction } from "@/lib/revenue/subscriptionBilling"
import {
  billingCycleLabel,
  formatDate,
  hostelRate,
  isInGracePeriod,
  isInactiveSubscription,
  isSubscriptionExpired,
  isTrialSubscription,
  moduleByKey,
  planLabel,
  subscriptionLifecycleCaption,
  upcomingChangeMessage,
} from "@/lib/revenue/utils"
import type { HostelSubscription } from "@/lib/revenue/types"

function Fact({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="min-w-[8.5rem] flex-1 py-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--yoco-text-muted)">{label}</p>
      <p className="mt-1.5 text-[15px] font-semibold tracking-tight text-(--yoco-text)">{value}</p>
      {hint ? <p className="mt-0.5 text-xs leading-snug text-(--yoco-text-muted)">{hint}</p> : null}
    </div>
  )
}

function LifecycleNote({ hostel }: { hostel: HostelSubscription }) {
  const { settings } = useRevenue()
  const graceDays = settings.defaultGraceDays
  const upcoming = upcomingChangeMessage(hostel)
  const trial = isTrialSubscription(hostel) && hostel.status === "trial"

  const note = hostel.status === "deactivated"
    ? {
        text: "This subscription has been deactivated. Contact your admin to restore access.",
        bar: "bg-slate-400",
        tone: "text-slate-800 bg-slate-50/80",
      }
    : isSubscriptionExpired(hostel, graceDays)
      ? {
          text: "Your subscription has expired. Renew the current plan or upgrade to continue using modules.",
          bar: "bg-red-500",
          tone: "text-red-900 bg-red-50/70",
        }
      : isInGracePeriod(hostel, graceDays)
        ? {
            text: "Grace period has started. Renew your current plan or upgrade to continue without interruption.",
            bar: "bg-amber-500",
            tone: "text-amber-950 bg-amber-50/70",
          }
        : trial
          ? {
              text: "You are on a trial. Please select a plan to continue.",
              bar: "bg-[#674D9F]",
              tone: "text-[#3d2d5c] bg-[#EDE8F4]/70",
            }
          : upcoming
            ? { text: upcoming, bar: "bg-[#674D9F]", tone: "text-[#3d2d5c] bg-[#EDE8F4]/70" }
            : null

  if (!note) return null

  return (
    <div className={`flex overflow-hidden rounded-lg ${note.tone}`}>
      <span className={`w-1 shrink-0 ${note.bar}`} aria-hidden />
      <p className="px-3.5 py-2.5 text-sm leading-relaxed">{note.text}</p>
    </div>
  )
}

export default function WardenOverview({ hostel }: { hostel: HostelSubscription }) {
  const { settings } = useRevenue()
  const graceDays = settings.defaultGraceDays
  const period = remainingFraction(hostel.renewalDate, hostel.billingCycle, {
    periodStart: hostel.subscriptionStartDate,
  })
  const expired = isInactiveSubscription(hostel, graceDays)
  const currentRate = hostelRate(hostel)
  const lifecycle = subscriptionLifecycleCaption(hostel, graceDays)
  const trial = isTrialSubscription(hostel)
  const moduleCount = expired ? 0 : hostel.activeModules.length
  const original = hostel.activatedStudentCount ?? hostel.studentCount
  const added = hostel.addedStudentCount ?? 0

  const isTrial = trial && hostel.status === "trial"
  const headerChipClass = isTrial
    ? "bg-blue-100 text-blue-800"
    : hostel.plan
      ? PLAN_COLORS[hostel.plan].chipClass
      : "bg-(--yoco-surface-muted) text-(--yoco-text-muted)"

  return (
    <div className="-mt-1">
      <div className="overflow-hidden rounded-2xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated)">
        <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--yoco-text-muted)">
                Current plan
              </p>
              <h2
                className={`mt-3 inline-flex rounded-md px-3.5 py-1.5 text-[1.65rem] font-semibold leading-none tracking-tight ${headerChipClass}`}
              >
                {isTrial ? "Trial" : planLabel(hostel.plan)}
              </h2>
              {hostel.plan || isTrial ? (
                <p className="mt-3 text-sm text-(--yoco-text-muted)">
                  <span className="text-lg font-semibold tracking-tight text-(--yoco-text)">₹{currentRate}</span>
                  <span className="ml-1">/seat/mo</span>
                </p>
              ) : null}
            </div>
            <p className={`pb-1 text-xs font-semibold tracking-wide ${lifecycle.className}`}>{lifecycle.label}</p>
          </div>

          <LifecycleNote hostel={hostel} />

          <div className="h-px bg-(--yoco-border-subtle)" />

          <div className="flex flex-wrap gap-y-5">
            <div className="min-w-[10rem] flex-1 pr-8">
              <Fact
                label="Seats"
                value={hostel.studentCount}
                hint={`Original ${original} · Added mid-cycle ${added}`}
              />
            </div>
            <div className="min-w-[10rem] flex-1 border-(--yoco-border-subtle) pr-8 sm:border-l sm:pl-8">
              <Fact label="Billing cycle" value={billingCycleLabel(hostel.billingCycle)} />
            </div>
            <div className="min-w-[12rem] flex-1 border-(--yoco-border-subtle) pr-8 sm:border-l sm:pl-8">
              <Fact
                label="Billing period"
                value={`${formatDate(hostel.subscriptionStartDate)} – ${formatDate(hostel.renewalDate)}`}
              />
            </div>
            <div className="min-w-[10rem] flex-1 border-(--yoco-border-subtle) sm:border-l sm:pl-8">
              <Fact
                label="Time left"
                value={
                  period.inOriginalPeriod
                    ? `${period.monthsLeft} month${period.monthsLeft === 1 ? "" : "s"} left`
                    : "Original billing period has ended"
                }
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--yoco-text-muted)">
              Active modules · {moduleCount}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {!expired && hostel.activeModules.length ? (
                hostel.activeModules.map((key) => {
                  const mod = moduleByKey(key)
                  return (
                    <span
                      key={key}
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        mod ? MODULE_PILL_CURRENT : "bg-(--yoco-surface-muted) text-(--yoco-text-muted)"
                      }`}
                    >
                      {mod?.name ?? key}
                    </span>
                  )
                })
              ) : (
                <span className="text-sm text-(--yoco-text-muted)">No active modules</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
