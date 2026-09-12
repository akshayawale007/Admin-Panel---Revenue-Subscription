"use client"
import dynamic from "next/dynamic"
import { ReactNode } from "react"
import { BackdropSidebar } from "../Sidebar/BackdropSidebar"

const Sidebars = dynamic(() => import("../Sidebar/Sidebar"), { ssr: false })
const Navbars = dynamic(() => import("../Navbar/Navbar"), { ssr: false })

type LayoutWrapperProps = {
  children: ReactNode
  /** Custom navbar (e.g. hostel page with breadcrumb). Defaults to standard navbar. */
  navbar?: ReactNode
}

export default function LayoutWrapper({ children, navbar }: LayoutWrapperProps) {
  return (
    <div className="flex h-screen w-full max-w-full flex-col overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebars />
        <BackdropSidebar />
        <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <div className="shrink-0 bg-(--yoco-surface-elevated)">
            {navbar ?? <Navbars />}
          </div>
          <div className="app-page-bg flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
