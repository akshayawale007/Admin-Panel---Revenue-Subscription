"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { TabItem, Tabs } from "flowbite-react"
import Button from "@/component/Common/Button/Button"
import ComparePlansModal from "@/component/Revenue/Demo/ComparePlansModal"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import OverviewTab from "./tabs/OverviewTab"
import PendingRequestsTab from "./tabs/PendingRequestsTab"
import InvoicesTab from "./tabs/InvoicesTab"
import HistoryTab from "./tabs/HistoryTab"
import UpgradeSubscriptionModal, {
  type UpgradeKind,
} from "@/component/Revenue/Shared/UpgradeSubscriptionModal"
import HostelIdentityCard from "@/component/Revenue/Shared/HostelIdentityCard"
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

export default function HostelDetailPage() {
  const params = useParams<{ id: string }>()
  const { getHostel, planModules, settings } = useRevenue()
  const hostel = getHostel(params.id)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [prefillKind, setPrefillKind] = useState<UpgradeKind | null>(null)
  const [prefillPlan, setPrefillPlan] = useState<PlanTier | "">("")

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
    return <p className="py-20 text-center text-sm text-(--yoco-text-muted)">No records found</p>
  }

  const pendingRequestCount = hostel.pendingRequests.filter(
    (r) => r.status === "pending" || r.status === "on_hold"
  ).length
  const pendingInvoiceCount = hostel.invoices.filter((inv) => inv.status === "unpaid").length
  const graceDays = settings.defaultGraceDays
  const inPeriodActive =
    hostel.status === "active" &&
    !isInGracePeriod(hostel, graceDays) &&
    !isSubscriptionExpired(hostel, graceDays)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-6">
      <HostelIdentityCard hostel={hostel} showAvatar codeLabel="Hostel ID" />

      <div className="yoco-page-card yoco-page-card--fit">
        <div className="modules-tabs modules-tabs--fit relative px-4 pt-1 pb-4 [&_[role=tablist]]:pr-56">
          <div className="hostel-tab-actions absolute top-2 right-4 z-10">
            <Button title="Compare plans" variant="secondary" onClick={() => setCompareOpen(true)} />
            <Button title="Upgrade" onClick={() => openUpgrade()} />
          </div>
          <Tabs variant="underline">
            <TabItem active title="Subscriptions">
              <OverviewTab hostel={hostel} />
            </TabItem>
            <TabItem title={<TabLabel title="Upgrade Requests" count={pendingRequestCount} />}>
              <PendingRequestsTab hostel={hostel} />
            </TabItem>
            <TabItem title={<TabLabel title="Invoices" count={pendingInvoiceCount} />}>
              <InvoicesTab hostel={hostel} />
            </TabItem>
            <TabItem title="History">
              <HistoryTab hostel={hostel} />
            </TabItem>
          </Tabs>
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
        mode="admin"
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
    </div>
  )
}
