"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { PencilIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import CustomToggle from "@/component/Common/Toggle/Toggle"
import TableIconButton, { TableActionGroup } from "@/component/Common/Table/TableIconButton"
import { useHostel } from "./HostelProvider"
import type { HostelRecord } from "@/lib/hostel/types"

const columnHeaders = () => {
  const router = useRouter()
  const { toggleStatus, selectHostel } = useHostel()

  const columns: ColumnDef<HostelRecord>[] = [
    {
      accessorKey: "hostelCode",
      header: "Hostel ID",
      size: 100,
      meta: { ellipsis: true, align: "center" },
    },
    {
      accessorKey: "name",
      header: "Hostel Name",
      size: 100,
      meta: { ellipsis: true },
    },
    {
      accessorKey: "staffCount",
      header: "Total Staff",
      size: 100,
      meta: { ellipsis: true, align: "center" },
    },
    {
      accessorKey: "studentCount",
      header: "Total Students",
      size: 100,
      meta: { ellipsis: true, align: "center" },
    },
    {
      accessorKey: "parentCount",
      header: "Total Parents",
      size: 100,
      meta: { ellipsis: true, align: "center" },
    },
    {
      accessorKey: "city",
      header: "City",
      size: 100,
      meta: { ellipsis: true, align: "center" },
      cell: ({ row }) => row.original.city?.label ?? "",
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      meta: { align: "center" },
      cell: ({ row }) => (
        <CustomToggle
          enabled={row.original.status}
          onChange={(e) => toggleStatus(row.original._id, e)}
        />
      ),
    },
    {
      accessorKey: "edit",
      header: "Action",
      size: 120,
      meta: { align: "center" },
      cell: ({ row }) => (
        <TableActionGroup>
          <TableIconButton
            icon={PencilIcon}
            label="Edit hostel"
            onClick={() => {
              selectHostel(row.original._id)
              router.push("/hostel/add-hostel/")
            }}
          />
          <TableIconButton
            icon={ShieldCheckIcon}
            label="Hostel permissions"
            onClick={() => {
              selectHostel(row.original._id)
              router.push("/custom-permission/hostel-permission/")
            }}
          />
        </TableActionGroup>
      ),
    },
  ]

  return { columns }
}

export default columnHeaders
