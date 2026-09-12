"use client"
import { ReactNode } from "react"
import { Bars3Icon } from "@heroicons/react/24/outline"
import { setSidebar } from "@/src/redux/slices/authSlices"
import { useAppDispatch, useAppSelector } from "@/src/redux/store"

type NavbarsProps = {
  children?: ReactNode
}

const Navbars = ({ children }: NavbarsProps) => {
  const open = useAppSelector((state) => state.auth.sidebar)
  const dispatch = useAppDispatch()

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) shadow-sm">
      <div className="flex h-16 min-h-16 w-full items-center gap-3 px-4 md:px-5">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => dispatch(setSidebar(!open))}
          className="shrink-0 cursor-pointer rounded-lg p-1 text-(--yoco-text) transition-colors hover:bg-(--yoco-row-hover) lg:hidden"
        >
          <Bars3Icon className="h-6 w-6 text-(--yoco-text)" />
        </button>

        {children ? <div className="min-w-0 flex-1">{children}</div> : null}
      </div>
    </header>
  )
}

export default Navbars
