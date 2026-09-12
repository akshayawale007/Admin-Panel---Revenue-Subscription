"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { PencilSquareIcon } from "@heroicons/react/24/outline"
import CommonTable from "@/component/Common/Table/Table"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"
import TableIconButton from "@/component/Common/Table/TableIconButton"
import { downloadCsv } from "@/component/Common/Table/exportUtils"
import { useHostel } from "@/component/Hostel/HostelProvider"
import type { HostelRole } from "@/lib/hostel/types"

const HostelPermission = () => {
  const router = useRouter()
  const { currentHostel, selectRole } = useHostel()

  useEffect(() => {
    if (!currentHostel) router.push("/custom-permission/")
  }, [currentHostel, router])

  const columns: ColumnDef<HostelRole>[] = [
    { accessorKey: "uniqueId", header: "Role ID" },
    { accessorKey: "name", header: "Role Name (Deisgnation)" },
    {
      accessorKey: "categoryType",
      header: "Role Category",
      meta: { align: "center", tooltip: true, ellipsis: true, width: "100px" },
    },
    {
      accessorKey: "edit",
      header: "Custom Permissions",
      meta: { align: "center" },
      cell: ({ row }) => (
        <TableIconButton
          icon={PencilSquareIcon}
          label="Edit custom permissions"
          onClick={() => {
            selectRole(row.original._id)
            router.push("/custom-permission/hostel-permission/permission/")
          }}
        />
      ),
    },
  ]

  const roles = currentHostel?.roles ?? []

  return (
    <LayoutWrapper
      navbar={
        <AppNavbar
          back
          title="Hostelwise Permissions"
          onBack={() => router.push("/custom-permission/")}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <CommonTable<HostelRole>
          paginationShow={false}
          showCheckbox
          showExport
          leadingContent={
            <p className="yoco-meta-text">
              Hostel <span className="yoco-meta-value">: {currentHostel?.name ?? "—"}</span>
            </p>
          }
          extraColumn={columns}
          data={roles}
          totalCount={roles.length}
          onExportSelected={(rows) =>
            downloadCsv(
              rows.map((r) => ({
                uniqueId: r.uniqueId,
                name: r.name,
                categoryType: r.categoryType,
              })),
              [
                { key: "uniqueId", header: "Role Id" },
                { key: "name", header: "Role Name (Deisgnation)" },
                { key: "categoryType", header: "Role Category" },
              ],
              "hostel-permission-selected"
            )
          }
        />
      </div>
    </LayoutWrapper>
  )
}

export default HostelPermission
