"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import dayjs from "dayjs"
import { ARR_TREND } from "@/lib/revenue/mockData"
import { formatINR } from "@/lib/revenue/utils"

const BAR_SIZE = 16

export default function ArrTrendCard() {
  const [from, setFrom] = useState(dayjs().subtract(11, "month").format("YYYY-MM"))
  const [to, setTo] = useState(dayjs().format("YYYY-MM"))

  const arrTrend = useMemo(() => {
    return ARR_TREND.filter((p) => p.month >= from && p.month <= to)
  }, [from, to])

  return (
    <div className="yoco-card p-4">
      <p className="mb-2 font-bold text-(--yoco-text)">ARR trend</p>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <label className="text-(--yoco-text-muted)">
          From{" "}
          <input
            type="month"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="yoco-input px-2 py-1"
          />
        </label>
        <label className="text-(--yoco-text-muted)">
          To{" "}
          <input
            type="month"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="yoco-input px-2 py-1"
          />
        </label>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={arrTrend} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--yoco-border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatINR(Number(v ?? 0))} />
          <Bar dataKey="arr" fill="#674D9F" maxBarSize={BAR_SIZE} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
