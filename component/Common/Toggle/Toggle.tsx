"use client"
import { FC } from "react"

type ToggleSwitchProps = {
  enabled?: boolean
  onChange?: (value: boolean) => void
  compact?: boolean
}

const ToggleSwitch: FC<ToggleSwitchProps> = ({ enabled, onChange, compact }) => {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!enabled)}
      className={`relative inline-flex cursor-pointer items-center rounded-full transition-colors duration-300 ${
        compact ? "h-[17.6px] w-[32.4px]" : "h-4 w-10"
      } ${enabled ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block transform rounded-full bg-white transition-transform duration-300 ${
          compact ? "h-[13.2px] w-[13.2px]" : "h-3 w-3"
        } ${enabled ? (compact ? "translate-x-[17.2px]" : "translate-x-6.5") : "translate-x-0.5"}`}
      />
    </button>
  )
}

export default ToggleSwitch
