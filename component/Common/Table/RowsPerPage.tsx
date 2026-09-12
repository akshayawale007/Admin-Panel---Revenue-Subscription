"use client"

import YocoSelect from "@/component/Common/Select/YocoSelect"

const ROWS = [5, 10, 25, 50, 100] as const

type RowsPerPageProps = {
  value: number
  onChange: (value: number) => void
}

export default function RowsPerPage({ value, onChange }: RowsPerPageProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 text-sm text-(--yoco-text-muted)">
      <span className="font-[420] whitespace-nowrap">Rows per page:</span>
      <YocoSelect
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
        ariaLabel="Rows per page"
        options={ROWS.map((item) => ({ value: String(item), label: String(item) }))}
        narrow
      />
    </div>
  )
}
