import { ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "danger"

interface ButtonProps {
  title?: string
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: ButtonVariant
  "aria-label"?: string
}

const variantClass: Record<ButtonVariant, { enabled: string; disabled: string }> = {
  primary: {
    enabled: "cursor-pointer bg-(--yoco-primary) text-white shadow-sm hover:bg-(--yoco-primary-dark)",
    disabled: "cursor-not-allowed bg-(--yoco-primary)/40 text-white shadow-none",
  },
  secondary: {
    enabled:
      "cursor-pointer border border-(--yoco-border-subtle) bg-transparent text-(--yoco-text) hover:bg-(--yoco-row-hover)",
    disabled:
      "cursor-not-allowed border border-(--yoco-border-subtle) bg-transparent text-(--yoco-text-muted) opacity-50",
  },
  danger: {
    enabled: "cursor-pointer bg-red-600 text-white shadow-sm hover:bg-red-700",
    disabled: "cursor-not-allowed bg-red-600/40 text-white shadow-none",
  },
}

const Button = ({
  title,
  icon,
  onClick,
  disabled,
  className = "",
  variant = "primary",
  "aria-label": ariaLabel,
}: ButtonProps) => {
  const tone = disabled ? variantClass[variant].disabled : variantClass[variant].enabled

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold transition-colors ${tone} ${className}`}
    >
      {title}
      {icon ? <span>{icon}</span> : null}
    </button>
  )
}

export default Button
