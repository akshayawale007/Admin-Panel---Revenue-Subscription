"use client"

import { useState } from "react"
import { TabItem, Tabs } from "flowbite-react"
import Button from "@/component/Common/Button/Button"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"
import ComparePlansModal from "@/component/Revenue/Demo/ComparePlansModal"
import WardenOverview from "@/component/Revenue/Demo/WardenOverview"
import UpgradeSubscriptionModal, {
  type UpgradeKind,
} from "@/component/Revenue/Shared/UpgradeSubscriptionModal"
import HistoryTab from "@/component/Revenue/Hostels/tabs/HistoryTab"
import InvoicesTab from "@/component/Revenue/Hostels/tabs/InvoicesTab"
import PendingRequestsTab from "@/component/Revenue/Hostels/tabs/PendingRequestsTab"
import HostelIdentityCard from "@/component/Revenue/Shared/HostelIdentityCard"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { isInGracePeriod, isSubscriptionExpired } from "@/lib/revenue/utils"
import type { PlanTier } from "@/lib/revenue/types"

function TabLabel({ title, count }: { title: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {title}
      {count ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#EDE8F4] px-1.5 text-[11px] font-semibold leading-5 text-[#674D9F]">
          {count}
        </span>
      ) : null}
    </span>
  )
}

export default function DemoSubscriptionPage() {
  const { hostels, planModules, settings } = useRevenue()
  const [hostelId, setHostelId] = useState(hostels[0]?.hostelId ?? "")
  const hostel = hostels.find((h) => h.hostelId === hostelId) ?? hostels[0]
  const [compareOpen, setCompareOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [prefillKind, setPrefillKind] = useState<UpgradeKind | null>(null)
  const [prefillPlan, setPrefillPlan] = useState<PlanTier | "">("")

  const graceDays = settings.defaultGraceDays
  const inGrace = hostel ? isInGracePeriod(hostel, graceDays) : false
  const openRequests = hostel?.pendingRequests.filter((r) => r.status === "pending" || r.status === "on_hold") ?? []
  const hasOpenRequest = openRequests.length > 0
  const pendingInvoiceCount = hostel?.invoices.filter((inv) => inv.status === "unpaid").length ?? 0
  const inPeriodActive = hostel
    ? hostel.status === "active" && !inGrace && !isSubscriptionExpired(hostel, graceDays)
    : false

  const openUpgrade = (kind: UpgradeKind | null = null, plan: PlanTier | "" = "") => {
    setPrefillKind(kind)
    setPrefillPlan(plan)
    setUpgradeOpen(true)
  }

  const applyCompareChoice = (tier: PlanTier) => {
    openUpgrade(tier === "CUSTOM" ? "modules" : "plan", tier === "CUSTOM" ? "" : tier)
    setCompareOpen(false)
  }

  if (!hostel) {
    return (
      <LayoutWrapper navbar={<AppNavbar title="Subscriptions (Warden)" />}>
        <p className="py-20 text-center text-sm text-(--yoco-text-muted)">No hostels found</p>
      </LayoutWrapper>
    )
  }

  const simulationCard = (
    <div className="flex h-14 w-80 max-w-[min(20rem,calc(100vw-11rem))] flex-col justify-center rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-3 py-1">
      <p className="shrink-0 text-[10px] font-semibold uppercase leading-tight tracking-wide text-(--yoco-text-muted)">
        Simulation
      </p>
      <label className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] text-(--yoco-text-muted)">
        <span className="hidden shrink-0 whitespace-nowrap sm:inline">Preview as warden of</span>
        <select
          aria-label="Preview as warden of"
          className="yoco-select-compact !h-7 !max-h-7 min-w-0 flex-1 shrink px-2.5 text-xs"
          value={hostel.hostelId}
          onChange={(e) => {
            setHostelId(e.target.value)
            setUpgradeOpen(false)
            setPrefillKind(null)
            setPrefillPlan("")
          }}
        >
          {hostels.map((h) => (
            <option key={h.hostelId} value={h.hostelId}>
              {h.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )

  return (
    <LayoutWrapper navbar={<AppNavbar title="Subscriptions (Warden)">{simulationCard}</AppNavbar>}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-6">
        <HostelIdentityCard hostel={hostel} />

        <div className="yoco-page-card yoco-page-card--fit">
          <div className="modules-tabs modules-tabs--fit relative px-4 pt-1 pb-4 [&_[role=tablist]]:pr-56">
            <div className="hostel-tab-actions absolute top-2 right-4 z-10">
              <Button title="Compare plans" variant="secondary" onClick={() => setCompareOpen(true)} />
              <Button title="Upgrade" onClick={() => openUpgrade()} disabled={hasOpenRequest} />
            </div>
            <Tabs variant="underline">
              <TabItem active title="Subscriptions">
                <WardenOverview hostel={hostel} />
              </TabItem>
              <TabItem title={<TabLabel title="Upgrade Requests" count={openRequests.length} />}>
                <PendingRequestsTab hostel={hostel} viewerRole="warden" />
              </TabItem>
              <TabItem title={<TabLabel title="Invoices" count={pendingInvoiceCount} />}>
                <InvoicesTab hostel={hostel} viewerRole="warden" />
              </TabItem>
              <TabItem title="History">
                <HistoryTab hostel={hostel} />
              </TabItem>
            </Tabs>
          </div>
        </div>
      </div>

      <UpgradeSubscriptionModal
        open={upgradeOpen}
        onClose={() => {
          setUpgradeOpen(false)
          setPrefillKind(null)
          setPrefillPlan("")
        }}
        hostel={hostel}
        mode="warden"
        initialKind={prefillKind}
        initialPlan={prefillPlan}
      />
      <ComparePlansModal
        open={compareOpen}
        setOpen={setCompareOpen}
        currentPlan={hostel.plan}
        planModules={planModules}
        canChoose
        canChooseCustom
        allowRenewCurrent={!inPeriodActive}
        allowDowngrade={!inPeriodActive}
        onChoosePlan={applyCompareChoice}
      />
    </LayoutWrapper>
  )
}
