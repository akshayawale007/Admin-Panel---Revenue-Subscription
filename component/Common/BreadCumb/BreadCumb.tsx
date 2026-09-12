import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"

interface HeaderProps {
  title?: string
  back?: boolean
  rest?: React.ReactNode
  children?: React.ReactNode
  onBack?: () => void
  variant?: "default" | "navbar"
}

const BreadCumb = ({ title, back, rest, children, onBack, variant = "default" }: HeaderProps) => {
  const router = useRouter()
  const isNavbar = variant === "navbar"

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div
      className={`flex w-full items-center justify-between gap-3 ${
        isNavbar ? "mb-0 h-auto" : "mb-3 h-10"
      }`}
    >
      <div className="min-w-0 flex-1">
        {title && (
          <div className="flex items-center gap-1">
            {back ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-(--yoco-text) transition-colors hover:bg-(--yoco-row-hover) hover:text-(--yoco-text) active:bg-(--yoco-border)"
              >
                <ChevronLeftIcon className="h-5 w-5 text-(--yoco-text)" />
              </button>
            ) : null}
            <p className="truncate font-bold text-(--yoco-text)">{title}</p>
            {rest}
          </div>
        )}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  )
}

export default BreadCumb
