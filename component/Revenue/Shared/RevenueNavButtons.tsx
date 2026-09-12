"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/revenue/reports/", label: "Reports" },
  { href: "/revenue/settings/", label: "Settings" },
]

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href.replace(/\/$/, ""))
}

export default function RevenueNavButtons() {
  const pathname = usePathname()

  return (
    <>
      {LINKS.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-sm font-semibold no-underline transition-colors ${
              active
                ? "border-[#674D9F] bg-[#674D9F] text-white"
                : "border-(--yoco-border-subtle) bg-transparent text-(--yoco-text) hover:bg-(--yoco-row-hover)"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
