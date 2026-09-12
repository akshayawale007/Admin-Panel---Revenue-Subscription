"use client"

import { useEffect, useState } from "react"

export function useSimulatedLoading(ms = 800) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}

export function RevenueSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bed-skeleton h-10 w-full rounded-md" />
      ))}
    </div>
  )
}
