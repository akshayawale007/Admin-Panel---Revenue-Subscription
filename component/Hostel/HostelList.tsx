"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "@heroicons/react/24/outline"
import CommonTable from "@/component/Common/Table/Table"
import DebounceAsyncSearch from "@/component/Common/Search/Search"
import StatusFilterButtons, { type StatusFilterValue } from "@/component/Common/Table/StatusFilterButtons"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"
import Button from "@/component/Common/Button/Button"
import { downloadCsv } from "@/component/Common/Table/exportUtils"
import { useHostel } from "./HostelProvider"
import columnHeaders from "./columnHeaders"
import type { HostelRecord } from "@/lib/hostel/types"

const EXPORT_COLUMNS = [
  { key: "hostelCode", header: "Hostel ID" },
  { key: "name", header: "Hostel Name" },
  { key: "staffCount", header: "Total Staff" },
  { key: "studentCount", header: "Total Students" },
  { key: "parentCount", header: "Total Parents" },
  { key: "city", header: "City" },
  { key: "status", header: "Status" },
]

function flatten(row: HostelRecord) {
  return {
    ...row,
    city: row.city?.label ?? "",
    status: row.status ? "Active" : "InActive",
  }
}

const HostelList = () => {
  const router = useRouter()
  const { hostels, selectHostel, setDraftDocs } = useHostel()
  const { columns } = columnHeaders()
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

  const onSearch = (value: string) => {
    setSearch(value)
    setPayload((prev) => ({ pagination: { ...prev.pagination, page: 1 } }))
  }

  const onFilterSelect = (value: StatusFilterValue) => {
    setStatus(value)
    setPayload((prev) => ({ pagination: { ...prev.pagination, page: 1 } }))
  }

  return (
    <LayoutWrapper
      navbar={
        <AppNavbar title="Hostel">
          <Button
            onClick={() => {
              selectHostel(null)
              setDraftDocs([])
              router.push("/hostel/add-hostel/")
            }}
            title="Add Hostel"
            icon={<PlusIcon className="my-auto size-5" />}
          />
        </AppNavbar>
      }
    >
      <CommonTable<HostelRecord>
        showCheckbox
        showExport
        paginationShow
        totalLabel="Hostels"
        totalCount={filtered.length}
        onExportSelected={(rows) =>
          downloadCsv(rows.map(flatten), EXPORT_COLUMNS, "hostels-selected")
        }
        onExportAll={() => downloadCsv(filtered.map(flatten), EXPORT_COLUMNS, "hostels-all")}
        resetSelectionKey={`${status}-${search}`}
        children={
          <>
            <StatusFilterButtons
              selected={status}
              onSelect={onFilterSelect}
              showActive
              showInActive
              showAll
            />
            <DebounceAsyncSearch
              onSearch={onSearch}
              debounceTimeout={400}
              placeholder="Search By Hostel Name"
            />
          </>
        }
        onPagination={(page, limit) => setPayload({ pagination: { page, limit } })}
        payload={payload}
        data={filtered.slice(
          (payload.pagination.page - 1) * payload.pagination.limit,
          payload.pagination.page * payload.pagination.limit
        )}
        extraColumn={columns}
      />
    </LayoutWrapper>
  )
}

export default HostelList
