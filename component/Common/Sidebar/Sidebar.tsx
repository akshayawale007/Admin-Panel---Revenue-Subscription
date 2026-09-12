"use client"
import { Sidebar, SidebarItem, SidebarItemGroup, SidebarItems } from "flowbite-react"
import Logo from "@/public/images/yoco_logo.png"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Link from "next/link"
import sidebarRoutes from "./sidebarRoutes"
import { SidebarUserMenu } from "./SidebarUserMenu"

const Sidebars = () => {
  const pathname = usePathname()

  const { routes } = sidebarRoutes()

  return (
    <div className="sidebar-wrapper z-100 hidden h-full min-h-0 w-64 shrink-0 flex-col border-r border-[var(--yoco-border-subtle)] bg-(--yoco-surface-elevated) shadow-sm lg:flex">
      <div className="flex shrink-0 justify-center border-b border-(--yoco-border-subtle) p-3">
        <Image className="mx-auto w-20" src={Logo} alt="Logo" />
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
        <Sidebar className="h-auto w-full bg-transparent shadow-none [&>div]:bg-transparent [&>div]:p-0">
          <SidebarItems className="border-0">
            <SidebarItemGroup className="mt-0 border-0 pt-0">
              {routes.map((item, index) => {
                const isActive =
                  pathname === item.link ||
                  (item.link === "/roles/" && pathname.startsWith("/permission")) ||
                  (item.link === "/roles/" && pathname.startsWith("/roles/roles-category/")) ||
                  (item.link === "/hostel/" && pathname.startsWith("/custom-permission/")) ||
                  (item.link === "/user/" && pathname.startsWith("/user/list/")) ||
                  (item.link === "/user/" && pathname.startsWith("/staff")) ||
                  (item.link === "/university/" &&
                    (pathname.startsWith("/university/") || pathname.startsWith("/college/"))) ||
                  (item.link === "/templates/" &&
                    (pathname.startsWith("/templates/category/") ||
                      pathname.startsWith("/templates/templateDetails/") ||
                      /^\/templates\/[^/]+/.test(pathname))) || // ✅ matches /templates/123 or /templates/abc etc. // ✅ backticks
                  (item.link === "/hostel/" && pathname.startsWith("/hostel/")) ||
                  (item.link === "/revenue/" && pathname.startsWith("/revenue"))
                return (
                  <SidebarItem
                    as={Link}
                    key={index}
                    href={item?.link}
                    className={`rounded-lg px-3 py-2.5 font-semibold transition ${isActive ? "bg-[#674D9F]! text-white shadow-md shadow-[#674D9F]/25 hover:bg-[#5a4189]! hover:shadow!" : "text-(--yoco-text)! hover:bg-[#674D9F]/10! hover:shadow-sm"} `}
                  >
                    <div
                      className={`flex items-center gap-2 text-[0.93rem] font-semibold ${isActive ? "text-white" : "text-(--yoco-text)"}`}
                    >
                      {item?.icon}
                      {item?.title}
                    </div>
                  </SidebarItem>
                )
              })}
            </SidebarItemGroup>
          </SidebarItems>
        </Sidebar>
      </div>

      <SidebarUserMenu />
    </div>
  )
}

export default Sidebars
