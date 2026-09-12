type TableTotalCountProps = {
  /** e.g. "Hostels", "Roles", "University" */
  label: string
  count?: number | string | null
  className?: string
}

export default function TableTotalCount({
  label,
  count = 0,
  className = "",
}: TableTotalCountProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center gap-2 rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-3 py-2 shadow-sm ${className}`}
    >
      <span className="text-xs font-semibold tracking-wide text-(--yoco-text-muted) uppercase">
        Total {label}
      </span>
      <span className="rounded-md bg-[#674D9F] px-2.5 py-0.5 text-sm font-bold text-white tabular-nums">
        {count ?? 0}
      </span>
    </div>
  )
}
