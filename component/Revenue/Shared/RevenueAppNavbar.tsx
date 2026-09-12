"use client"

import { usePathname, useRouter } from "next/navigation"
import { AppNavbar } from "@/component/Navbar"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import RevenueNavButtons from "./RevenueNavButtons"

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, "") || "/"
}

function resolveRevenueNav(
  pathname: string,
  hostelName?: string
): { title: string; backHref?: string; titleHref?: string } {
  const path = normalizePath(pathname)

  if (path === "/revenue") return { title: "Revenue/Subscriptions" }
  if (path.startsWith("/revenue/hostels/")) {
    const suffix = hostelName ? ` > ${hostelName}` : ""
    return { title: `Revenue/Subscriptions${suffix}`, backHref: "/revenue/", titleHref: "/revenue/" }
  }
  if (path.startsWith("/revenue/insights") || path.startsWith("/revenue/reports")) {
    return { title: "Revenue/Subscriptions > Reports", backHref: "/revenue/", titleHref: "/revenue/" }
  }
  if (path.startsWith("/revenue/settings")) return { title: "Revenue/Subscriptions > Settings", backHref: "/revenue/", titleHref: "/revenue/" }

  return { title: "Revenue/Subscriptions" }
}

export default function RevenueAppNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { getHostel } = useRevenue()
  const path = normalizePath(pathname)
  const hostelMatch = path.match(/^\/revenue\/hostels\/([^/]+)$/)
  const hostelName = hostelMatch ? getHostel(hostelMatch[1])?.name : undefined
  const { title, backHref, titleHref } = resolveRevenueNav(pathname, hostelName)

  return (
    <AppNavbar
      title={title}
      titleHref={titleHref}
      back={Boolean(backHref)}
      onBack={backHref ? () => router.push(backHref) : undefined}
    >
      <RevenueNavButtons />
    </AppNavbar>
  )
}
