"use client"

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table"
import { Fragment, ReactNode, useMemo, useRef, useState, useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "flowbite-react"
import RowsPerPage from "./RowsPerPage"
import Button from "../Button/Button"
import Loader from "../Loader/Loader"
import { useAppDispatch } from "@/src/redux/store"
import TableTotalCount from "./TableTotalCount"
import { buildExportColumns, downloadCsv, type ExportColumn } from "./exportUtils"

export type { ExportColumn }

type PaginationPayload = {
  pagination?: {
    page: number
    limit: number
  }
  page?: number
  limit?: number
}

type TableProps<T> = {
  showExport?: boolean
  showCheckbox?: boolean
  /** When false and checkboxes are off, no Sr. No. column is injected. Default true. */
  showSrNo?: boolean
  data?: T[]
  extraColumn?: ColumnDef<T, any>[]
  pageSize?: number
  pageIndex?: number
  totalCount?: number
  /** e.g. "Hostels" → renders "Total Hostels : {totalCount}" in the toolbar */
  totalLabel?: string
  /** Renders on the left of the toolbar row (e.g. Staff / Student / Parent tabs) */
  leadingContent?: ReactNode
  children?: ReactNode
  paginationShow?: boolean
  setPage?: (page: any) => void
  setPageSize?: (page: number) => void
  setPayload?: () => void
  payload?: PaginationPayload
  onPagination?: (page: number, limit: number) => void
  width?: string
  ellipsis?: boolean
  loading?: boolean
  tableHeight?: string
  /** NOTE: renamed from `export` — `export` is a reserved JS/TS keyword and cannot be used as a prop/param name */
  enableExport?: boolean
  exportOnly?: boolean
  exportDispatch?: (rows: T[]) => any
  removeDispatch?: (ids: string[]) => any
  selectedRowsForExport?: T[]
  onExportSelected?: (rows: T[]) => void
  onExportAll?: (rows: T[]) => void
  /** Specify which columns to export. If provided, only these columns will be included in CSV export */
  exportColumnsConfig?: Array<{ key: string; header: string }>
  /** Bump this value (e.g. on filter change) to force-clear the persisted cross-page selection */
  resetSelectionKey?: string | number
  /** When false, the table body does not scroll horizontally */
  overflowX?: boolean
  /** Optional second row rendered under each data row (single cell, full colspan) */
  renderSubRow?: (row: T) => ReactNode
}

export default function CommonTable<T extends { _id?: string }>({
  showExport = true,
  data = [],
  extraColumn = [],
  showCheckbox = true,
  showSrNo = true,
  totalCount = 0,
  totalLabel,
  leadingContent,
  children,
  paginationShow = false,
  payload,
  onPagination = () => {},
  loading = false,
  tableHeight,
  enableExport = false,
  exportOnly = false,
  exportDispatch,
  removeDispatch,
  selectedRowsForExport,
  onExportSelected,
  exportColumnsConfig,
  resetSelectionKey,
  overflowX = true,
  renderSubRow,
}: TableProps<T>) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  // ✅ Persisted across pages: id -> full row object, so export works even after
  // the row has scrolled out of the current page's `data` prop.
  const [selectedDataMap, setSelectedDataMap] = useState<Record<string, T>>({})

  // ✅ Extract page early so we can use it in dependency array
  const currentPage: number = payload?.pagination?.page ?? payload?.page ?? 1

  const prevSelectionRef: any = useRef({})

  // ✅ Only clear selection when explicitly told to (e.g. filters changed),
  // NOT on every page change — that's what was wiping cross-page selection.
  useEffect(() => {
    setRowSelection({})
    setSelectedDataMap({})
    prevSelectionRef.current = {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSelectionKey])

  const selectedRowCount = Object.keys(selectedDataMap).length

  // ✅ Moved above useMemo so they're accessible inside it
  const limit: number = payload?.pagination?.limit ?? payload?.limit ?? 10
  const page: number = currentPage

  const columns = useMemo<ColumnDef<T>[]>(() => {
    const selectColumn: ColumnDef<T> = {
      id: "select",
      size: 40,
      meta: { align: "center" },
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          style={{ borderWidth: "0.3px" }}
          className="h-3 w-3 cursor-pointer appearance-none rounded-sm border border-gray-200 bg-white shadow-sm checked:border-[#674D9F] checked:bg-[#674D9F]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          style={{ borderWidth: "0.3px" }}
          className="h-3 w-3 cursor-pointer appearance-none rounded-sm border border-gray-200 bg-white shadow-sm checked:border-[#674D9F] checked:bg-[#674D9F]"
        />
      ),
    }

    const srNoColumn: ColumnDef<T> = {
      id: "srNo",
      size: 70,
      meta: { align: "center" },
      header: () => "Sr. No.",
      cell: ({ row }) => <span>{(page - 1) * limit + row.index + 1}</span>,
    }

    if (showCheckbox) return [selectColumn, ...extraColumn]
    if (!showSrNo) return extraColumn
    return [srNoColumn, ...extraColumn]
  }, [showCheckbox, showSrNo, extraColumn, page, limit])

  const pageCount = Math.max(1, Math.ceil(totalCount / limit))
  const isFirstPage = page <= 1
  const isLastPage = page >= pageCount

  const dispatch = useAppDispatch()
  const exportColumns = useMemo(
    () => exportColumnsConfig || buildExportColumns<T>(columns),
    [exportColumnsConfig, columns]
  )

  const handleExport = (rowsToExport: T[], fileName: string) => {
    if (!rowsToExport.length) return
    const safeFileName = fileName.replace(/\s+/g, "-").toLowerCase()
    downloadCsv(rowsToExport, exportColumns, safeFileName)
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    manualPagination: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (originalRow, index) => {
      const row = originalRow as { _id?: string; id?: string; hostelId?: string }
      return row._id || row.id || row.hostelId || `row-${index}`
    },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === "function" ? updater(rowSelection) : updater
      setRowSelection(newSelection)

      const newlyCheckedIds = Object.keys(newSelection).filter(
        (id) => newSelection[id] && !prevSelectionRef.current[id]
      )
      const uncheckedIds = Object.keys(prevSelectionRef.current).filter(
        (id) => prevSelectionRef.current[id] && !newSelection[id]
      )

      // ✅ Keep the persisted id -> row map in sync, independent of which
      // page's `data` is currently loaded.
      if (newlyCheckedIds.length || uncheckedIds.length) {
        setSelectedDataMap((prevMap) => {
          const updatedMap = { ...prevMap }

          if (newlyCheckedIds.length) {
            const newlyCheckedRows = data.filter((row) =>
              newlyCheckedIds.includes(String(row?._id))
            )
            newlyCheckedRows.forEach((row) => {
              updatedMap[String(row._id)] = row
            })
          }

          uncheckedIds.forEach((id) => {
            delete updatedMap[id]
          })

          return updatedMap
        })
      }

      if (newlyCheckedIds.length) {
        const newlyCheckedRows = data.filter((row) => newlyCheckedIds.includes(String(row?._id)))
        if (exportDispatch) dispatch(exportDispatch(newlyCheckedRows))
      }

      if (uncheckedIds.length) {
        if (removeDispatch) dispatch(removeDispatch(uncheckedIds))
      }

      prevSelectionRef.current = newSelection
    },
  })

  const getRowsForExport = (): T[] => {
    if (selectedRowsForExport?.length) return selectedRowsForExport
    return Object.values(selectedDataMap)
  }

  const handleSelectedExport = () => {
    const rowsToExport = getRowsForExport()
    if (!rowsToExport.length) return

    if (onExportSelected) {
      onExportSelected(rowsToExport)
      return
    }

    handleExport(rowsToExport, totalLabel || "selected-data")
  }

  const handleClearSelection = () => {
    setRowSelection({})
    setSelectedDataMap({})
    prevSelectionRef.current = {}
  }

  if (exportOnly) {
    return (
      <div className="flex flex-wrap items-center justify-start gap-2">
        <Button
          disabled={selectedRowCount === 0 && !selectedRowsForExport?.length}
          onClick={handleSelectedExport}
          title="Export"
        />
        {selectedRowCount > 0 && (
          <Button onClick={handleClearSelection} title="Clear Selection" variant="secondary" />
        )}
      </div>
    )
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) shadow-md"
      style={tableHeight ? { height: tableHeight, maxHeight: tableHeight } : { maxHeight: "100%" }}
    >
      {/* Top children slot */}
      {(totalLabel || leadingContent || children) && (
        <div className="shrink-0 border-b border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-3 py-2 sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {totalLabel ? (
              <TableTotalCount label={totalLabel} count={totalCount} />
            ) : leadingContent ? (
              leadingContent
            ) : null}
            {children ? <div className="yoco-table-toolbar-actions">{children}</div> : null}
          </div>
        </div>
      )}

      {/* Table wrapper */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto bg-(--yoco-surface-elevated) ${
          overflowX ? "overflow-x-auto" : "overflow-x-hidden"
        }`}
      >
        <table className={`w-full border-collapse ${overflowX ? "min-w-160" : "table-fixed"}`}>
          <thead className="yoco-table-header-row sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const meta = header.column.columnDef.meta as any
                  const isCenter = meta?.align === "center"
                  const colSize = header.column.getSize()

                  return (
                    <th
                      key={header.id}
                      style={{
                        width: colSize,
                        ...(overflowX ? { minWidth: colSize } : {}),
                        ...(meta?.ellipsis ? { maxWidth: colSize } : {}),
                      }}
                      className={`px-2 py-3 text-xs font-bold tracking-wide text-(--yoco-text-muted) uppercase first:pl-5 last:pr-5 ${
                        isCenter ? "text-center" : "text-left"
                      }`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <Loader />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-20 text-center text-sm text-(--yoco-text-muted)"
                >
                  No data found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => {
                const subRow = renderSubRow?.(row.original)
                const zebra =
                  rowIndex % 2 === 0 ? "bg-(--yoco-surface-elevated)" : "bg-(--yoco-row-alt)"
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`border-b border-(--yoco-border-subtle) transition-colors hover:bg-(--yoco-row-hover) ${zebra}`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as any
                        const ellipsis = meta?.ellipsis
                        const isCenter = meta?.align === "center"
                        const colSize = cell.column.getSize()
                        const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext())

                        return (
                          <td
                            key={cell.id}
                            className={`py-3 text-sm text-(--yoco-text) first:pl-5 last:pr-5 ${isCenter ? "px-2" : "px-4"}`}
                            style={{
                              width: colSize,
                              ...(overflowX ? { minWidth: colSize } : {}),
                              ...(ellipsis ? { maxWidth: colSize } : {}),
                            }}
                          >
                            {ellipsis ? (
                              <div
                                className={`group relative ${isCenter ? "flex justify-center" : ""}`}
                              >
                                <div className="truncate">{cellContent}</div>
                                <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-50 -translate-x-1/2 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                                  {cellContent}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </div>
                              </div>
                            ) : (
                              <div className={isCenter ? "flex justify-center" : ""}>{cellContent}</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                    {subRow ? (
                      <tr className={`border-b border-(--yoco-border-subtle) ${zebra}`}>
                        <td colSpan={columns.length} className="px-4 py-2">
                          {subRow}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {/* {paginationShow && ( */}
      <div className="sticky bottom-0 z-20 shrink-0 border-t border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-4 py-3 sm:px-5">
        <div
          className={
            showExport ? "flex flex-col gap-3 md:flex-row md:items-center" : "flex flex-col"
          }
        >
          {showExport && (
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 md:justify-start">
              <Button
                disabled={selectedRowCount === 0 && !selectedRowsForExport?.length}
                onClick={handleSelectedExport}
                title="Export"
              />
              {selectedRowCount > 0 && (
                <Button onClick={handleClearSelection} title="Clear Selection" variant="secondary" />
              )}
            </div>
          )}
          {paginationShow && (
            <div className="table-pagination-bar">
              <div className="flex max-w-full flex-col items-center gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
                <RowsPerPage
                  value={payload?.pagination?.limit ?? payload?.limit ?? 10}
                  onChange={(item) => onPagination(1, item)}
                />

                <div className="flex items-center gap-1 overflow-x-auto">
                  {(() => {
                    const pages: (number | string)[] = []
                    if (pageCount <= 7) {
                      for (let i = 1; i <= pageCount; i++) pages.push(i)
                    } else {
                      pages.push(1, 2, 3, 4, 5, "...", pageCount)
                    }
                    return pages.map((p, i) =>
                      p === "..." ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="px-1 text-sm text-(--yoco-text-muted)"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onPagination(Number(p), limit)}
                          className={`h-8 w-8 shrink-0 cursor-pointer rounded-lg border text-sm font-medium transition-all ${
                            page === p
                              ? "border-[#674D9F] bg-[#674D9F] text-white"
                              : "border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) text-(--yoco-text) hover:border-(--yoco-border) hover:bg-(--yoco-row-hover)"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPagination(page - 1, limit)}
                    disabled={isFirstPage}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-3 py-1.5 text-sm font-medium text-(--yoco-text) shadow-sm transition-all hover:bg-(--yoco-row-hover) disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => onPagination(page + 1, limit)}
                    disabled={isLastPage}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-3 py-1.5 text-sm font-medium text-(--yoco-text) shadow-sm transition-all hover:bg-(--yoco-row-hover) disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* )} */}
    </div>
  )
}
