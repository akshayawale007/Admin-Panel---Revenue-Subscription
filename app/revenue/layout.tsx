"use client"

import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import RevenueAppNavbar from "@/component/Revenue/Shared/RevenueAppNavbar"

export default function RevenueLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutWrapper navbar={<RevenueAppNavbar />}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </LayoutWrapper>
  )
}
