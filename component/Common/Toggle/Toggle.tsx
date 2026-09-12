"use client"
import { FC } from "react"

type ToggleSwitchProps = {
  enabled?: boolean
  onChange?: (value: boolean) => void
}

const ToggleSwitch: FC<ToggleSwitchProps> = ({ enabled, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!enabled)}
      className={`relative inline-flex h-4 w-10 cursor-pointer items-center rounded-full transition-colors duration-300 ${
        enabled ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
          enabled ? "translate-x-6.5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

export default ToggleSwitch
