"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Button from "@/component/Common/Button/Button"

type Props = {
  disabled: boolean
  hint: string
  onClick: () => void
}

export default function UpgradeActionButton({ disabled, hint, onClick }: Props) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const button = (
    <Button
      title="Upgrade"
      onClick={onClick}
      disabled={disabled}
      className={disabled ? "pointer-events-none" : undefined}
    />
  )

  if (!disabled) return button

  return (
    <span
      className="inline-flex"
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
      }}
      onMouseLeave={() => setPos(null)}
    >
      {button}
      {pos && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-[400] w-72 rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-3 py-2 text-left text-xs font-normal leading-relaxed text-(--yoco-text) shadow-md"
              style={{ top: pos.top, right: pos.right }}
            >
              {hint}
            </span>,
            document.body
          )
        : null}
    </span>
  )
}
