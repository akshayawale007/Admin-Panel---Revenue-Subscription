"use client"

import HostelSubscriptionTable from "@/component/Revenue/Hostels/HostelSubscriptionTable"

export default function OverviewDashboard() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-1">
      <HostelSubscriptionTable />
    </div>
  )
}
