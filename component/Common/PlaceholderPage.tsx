"use client"

import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <LayoutWrapper navbar={<AppNavbar title={title} />}>
      <div className="yoco-page-card flex items-center justify-center p-10">
        <p className="text-sm font-medium text-(--yoco-text-muted)">
          {title} lives in the main Super Admin. This prototype only implements Revenue.
        </p>
      </div>
    </LayoutWrapper>
  )
}
