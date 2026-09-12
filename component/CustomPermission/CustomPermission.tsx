"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { PencilSquareIcon } from "@heroicons/react/24/outline"
import CommonTable from "@/component/Common/Table/Table"
import DebounceAsyncSearch from "@/component/Common/Search/Search"
import StatusFilterButtons, { type StatusFilterValue } from "@/component/Common/Table/StatusFilterButtons"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"
import TableIconButton from "@/component/Common/Table/TableIconButton"
import { useHostel } from "@/component/Hostel/HostelProvider"
import type { HostelRecord } from "@/lib/hostel/types"

const CustomPermission = () => {
  const router = useRouter()
  const { hostels, selectHostel } = useHostel()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilterValue>("all")
  const [payload, setPayload] = useState({ pagination: { page: 1, limit: 10 } })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return hostels.filter((h) => {
      if (status === "active" && !h.status) return false
      if (status === "inactive" && h.status) return false
      if (!q) return true
      return h.name.toLowerCase().includes(q) || h.hostelCode.toLowerCase().includes(q)
    })
  }, [hostels, search, status])

  const columns: ColumnDef<HostelRecord>[] = [
    {
      accessorKey: "hostelCode",
      header: "Hostel ID",
      size: 120,
      meta: { ellipsis: true, align: "center" },
    },
    {
      accessorKey: "name",
      header: "Hostel Name",
      size: 180,
      meta: { ellipsis: true, align: "center" },
    },
    {
      accessorKey: "city",
      header: "City",
      size: 120,
      meta: { ellipsis: true, align: "center" },
      cell: ({ row }) => row.original.city?.label ?? "",
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      meta: { align: "center" },
      cell: ({ row }) => (
        <p
          className={`w-20 rounded-full px-3 py-1 text-center text-xs font-semibold ${
            row.original.status ? "bg-green-100 text-green-400" : "bg-red-100 text-red-300"
          }`}
        >
          {row.original.status ? "Active" : "InActive"}
        </p>
      ),
    },
    {
      accessorKey: "edit",
      header: "Action",
      size: 80,
      meta: { align: "center" },
      cell: ({ row }) => (
        <TableIconButton
          icon={PencilSquareIcon}
          label="Edit hostel permission"
          onClick={() => {
            selectHostel(row.original._id)
            router.push("/custom-permission/hostel-permission/")
          }}
        />
      ),
    },
  ]

  const page = payload.pagination.page
  const limit = payload.pagination.limit

  return (
    <LayoutWrapper navbar={<AppNavbar back title="Custom Permissions" onBack={() => router.push("/hostel/")} />}>
      <div className="flex min-h-0 flex-1 flex-col">
        <CommonTable<HostelRecord>
          loading={false}
          paginationShow
          totalLabel="Hostels"
          totalCount={filtered.length}
          showCheckbox={false}
          showExport={false}
          resetSelectionKey={`${status}-${search}`}
          extraColumn={columns}
          payload={payload}
          onPagination={(p, l) => setPayload({ pagination: { page: p, limit: l } })}
          data={filtered.slice((page - 1) * limit, page * limit)}
        >
          <StatusFilterButtons
            showAll
            showActive
            showInActive
            selected={status}
            onSelect={(v) => {
              setStatus(v)
              setPayload((prev) => ({ pagination: { ...prev.pagination, page: 1 } }))
            }}
          />
          <DebounceAsyncSearch
            onSearch={(v) => {
              setSearch(v)
              setPayload((prev) => ({ pagination: { ...prev.pagination, page: 1 } }))
            }}
            placeholder="Search hostel..."
          />
        </CommonTable>
      </div>
    </LayoutWrapper>
  )
}

export default CustomPermission
