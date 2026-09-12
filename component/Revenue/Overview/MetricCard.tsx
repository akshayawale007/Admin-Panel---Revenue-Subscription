"use client"

import { useRouter } from "next/navigation"

type Props = {
  label: string
  value: string
  href?: string | null
  active?: boolean
  size?: "compact" | "comfortable"
}

export default function MetricCard({ label, value, href, active, size = "compact" }: Props) {
  const router = useRouter()
  const clickable = Boolean(href)
  const comfortable = size === "comfortable"

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => href && router.push(href)}
      className={`flex items-center rounded-xl border text-left transition-all ${
        comfortable ? "min-h-24 px-3 py-3" : "min-h-0 px-3 py-2"
      } ${
        active
          ? "border-[#674D9F] bg-[#F6F3FA] ring-1 ring-[#674D9F]/30"
          : "border-(--yoco-border-subtle) bg-(--yoco-surface-elevated)"
      } ${clickable ? "cursor-pointer hover:border-[#674D9F] hover:shadow-sm" : "cursor-default"}`}
    >
      <span className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-(--yoco-text-muted) uppercase">{label}</p>
        <p
          className={`truncate font-bold leading-tight text-(--yoco-text) ${
            comfortable ? "mt-1.5 text-xl" : "text-base"
          }`}
        >
          {value}
        </p>
      </span>
    </button>
  )
}
