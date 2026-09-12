"use client"

import { Suspense } from "react"
import OverviewDashboard from "@/component/Revenue/Overview/OverviewDashboard"
import { RevenueSkeleton } from "@/component/Revenue/Shared/RevenueSkeleton"

export default function Page() {
  return (
    <Suspense fallback={<RevenueSkeleton />}>
      <OverviewDashboard />
    </Suspense>
  )
}
