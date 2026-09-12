import { ComponentType, ReactNode, SVGProps } from "react"

type TableIconButtonProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  onClick?: () => void
  label: string
  variant?: "default" | "danger"
  className?: string
}

const variantClasses = {
  default:
    "border-[#674D9F]/25 bg-[#674D9F]/10 text-[#674D9F] hover:border-[#674D9F]/40 hover:bg-[#674D9F]/20",
  danger: "border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100",
}

export default function TableIconButton({
  icon: Icon,
  onClick,
  label,
  variant = "default",
  className = "",
}: TableIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg border p-2 transition-colors ${variantClasses[variant]} ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

export function TableActionGroup({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`flex items-center justify-center gap-2 ${className}`}>{children}</div>
}
