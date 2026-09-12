"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TabItem, Tabs } from "flowbite-react"
import { Checkbox } from "flowbite-react"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"
import Button from "@/component/Common/Button/Button"
import { useHostel } from "@/component/Hostel/HostelProvider"
import type { PermissionRow } from "@/lib/hostel/types"

function PermissionTable({
  data,
  onChange,
}: {
  data: PermissionRow[]
  onChange: (row: PermissionRow, field: keyof PermissionRow, checked: boolean) => void
}) {
  return (
    <div className="bg-(--yoco-surface-elevated)">
      <div className="max-h-[calc(100vh-240px)] overflow-y-auto overscroll-contain">
        <table className="w-full border-collapse">
          <thead className="yoco-table-header-row sticky top-0 z-10">
            <tr>
              <th scope="col" className="yoco-table-header-cell sm:px-5">
                Modules (Routes)
              </th>
              {["View", "Edit", "Create", "Delete"].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="yoco-table-header-cell yoco-table-header-cell--center yoco-table-action-col sm:px-5"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-24 text-center text-sm text-(--yoco-text-muted)">
                  No modules found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item._id} className="yoco-table-body-row">
                  <th scope="row" className="yoco-table-body-cell text-left font-medium sm:px-5">
                    {item.title}
                  </th>
                  {(["view", "edit", "add", "delete"] as const).map((field) => (
                    <td key={field} className="yoco-table-body-cell text-center sm:px-5">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={item[field]}
                          onChange={(e) => onChange(item, field, e.target.checked)}
                          className="cursor-pointer accent-[#674D9F]"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Permission = () => {
  const router = useRouter()
  const { currentHostel, currentRole, saveRolePermissions } = useHostel()
  const [web, setWeb] = useState<PermissionRow[]>([])
  const [mobile, setMobile] = useState<PermissionRow[]>([])

  useEffect(() => {
    if (!currentHostel || !currentRole) {
      router.push("/custom-permission/hostel-permission/")
      return
    }
    setWeb(currentRole.web.map((r) => ({ ...r })))
    setMobile(currentRole.mobile.map((r) => ({ ...r })))
  }, [currentHostel, currentRole, router])

  const roleCategory = String(currentRole?.name ?? "").toLowerCase()
  const showWebPanel = roleCategory !== "student" && roleCategory !== "parent"

  const patch = (
    setter: typeof setWeb,
    item: PermissionRow,
    field: keyof PermissionRow,
    checked: boolean
  ) => {
    setter((prev) => prev.map((row) => (row._id === item._id ? { ...row, [field]: checked } : row)))
  }

  return (
    <LayoutWrapper
      navbar={
        <AppNavbar
          back
          title="Custom Permissions"
          subtitle={currentHostel?.name}
          onBack={() => router.push("/custom-permission/hostel-permission/")}
        />
      }
    >
      <div className="yoco-page-card yoco-page-card--fit flex flex-col overflow-hidden">
        <div className="shrink-0 border-b border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-4 sm:gap-8">
              <p className="yoco-meta-text">
                Role Name{" "}
                <span className="yoco-meta-value">: {currentRole?.categoryType ?? "—"}</span>
              </p>
              <p className="yoco-meta-text">
                Role Category <span className="yoco-meta-value">: {currentRole?.name ?? "—"}</span>
              </p>
            </div>
            <Button
              title="Done"
              onClick={() => {
                if (!currentHostel || !currentRole) return
                saveRolePermissions(currentHostel._id, currentRole._id, web, mobile)
                router.push("/custom-permission/hostel-permission/")
              }}
            />
          </div>
        </div>
        <div className="modules-tabs modules-tabs--fit px-4 pt-1 pb-3 sm:px-5">
          <Tabs aria-label="Custom permission platform tabs" variant="underline">
            {showWebPanel && (
              <TabItem active title="Web Panel">
                <PermissionTable
                  data={web}
                  onChange={(item, field, checked) => patch(setWeb, item, field, checked)}
                />
              </TabItem>
            )}
            <TabItem active={!showWebPanel} title="Mobile Panel">
              <PermissionTable
                data={mobile}
                onChange={(item, field, checked) => patch(setMobile, item, field, checked)}
              />
            </TabItem>
          </Tabs>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default Permission
