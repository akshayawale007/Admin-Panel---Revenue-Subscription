"use client"
import {
  Drawer,
  DrawerHeader,
  DrawerItems,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react"
import { useAppDispatch, useAppSelector } from "@/src/redux/store"
import { setSidebar } from "@/src/redux/slices/authSlices"
import Logo from "@/public/images/yoco_logo.png"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Link from "next/link"
import sidebarRoutes from "./sidebarRoutes"
import { SidebarUserMenu } from "./SidebarUserMenu"

/** Flowbite Drawer/Sidebar use dark:bg-gray-* which must follow app theme, not OS. */
const drawerTheme = {
  root: {
    base: "fixed z-40 overflow-y-auto border-r border-(--yoco-border-subtle) bg-(--yoco-surface-elevated)! p-4 transition-transform",
    backdrop: "fixed inset-0 z-30 bg-black/40",
  },
}

const sidebarTheme = {
  root: {
    inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-transparent! px-0 py-0",
  },
  item: {
    base: "flex items-center justify-center rounded-lg p-2 text-base font-normal text-(--yoco-text) hover:bg-[#674D9F]/10",
  },
  itemGroup: {
    base: "mt-4 space-y-2 border-t border-(--yoco-border-subtle) pt-4 first:mt-0 first:border-t-0 first:pt-0",
  },
}

export function BackdropSidebar() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((state) => state.auth?.sidebar)

  const handleClose = () => {
    dispatch(setSidebar(false))
  }
  const pathname = usePathname()

  const { routes } = sidebarRoutes()

  return (
    <div className="fixed z-100 block lg:hidden">
      <Drawer
        open={open}
        onClose={handleClose}
        theme={drawerTheme}
        className="h-full bg-(--yoco-surface-elevated)! text-(--yoco-text)"
      >
        <DrawerHeader titleIcon={() => <></>} />
        <DrawerItems className="flex h-[calc(100%-4rem)] min-h-0 flex-col bg-(--yoco-surface-elevated)! p-0">
          <div className="flex h-full min-h-0 flex-col bg-(--yoco-surface-elevated)">
            <div className="flex shrink-0 justify-center border-b border-(--yoco-border-subtle) p-3">
              <Image className="mx-auto w-20" src={Logo} alt="Logo" />
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-(--yoco-surface-elevated) px-2 py-3">
              <Sidebar
                aria-label="Sidebar"
                theme={sidebarTheme}
                className="h-auto w-full bg-transparent! shadow-none [&>div]:bg-transparent! [&>div]:p-0"
              >
                <SidebarItems className="border-0">
                  <SidebarItemGroup className="border-0">
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
                        (item.link === "/hostel/" && pathname.startsWith("/hostel/")) ||
                        (item.link === "/revenue/" && pathname.startsWith("/revenue")) ||
                        (item.link === "/latest-changes/" && pathname.startsWith("/latest-changes"))

                      return (
                        <SidebarItem
                          as={Link}
                          key={index}
                          href={item?.link}
                          className={`rounded-lg px-3 py-2.5 font-semibold transition ${
                            isActive
                              ? "bg-[#674D9F]! text-white shadow-md shadow-[#674D9F]/25 hover:bg-[#5a4189]! hover:shadow!"
                              : "text-(--yoco-text)! hover:bg-[#674D9F]/10! hover:shadow-sm"
                          } `}
                        >
                          <div
                            className={`flex items-center gap-2 text-[0.93rem] font-semibold ${
                              isActive ? "text-white" : "text-(--yoco-text)"
                            }`}
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

            <SidebarUserMenu onAfterAction={handleClose} />
          </div>
        </DrawerItems>
      </Drawer>
    </div>
  )
}
