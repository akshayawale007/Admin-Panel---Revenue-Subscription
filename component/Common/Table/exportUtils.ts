export type ExportColumn = {
  key: string
  header: string
}

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return ""
  const normalized = String(value)
  const escaped = normalized.replace(/"/g, '""')
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
}

export const buildExportColumns = <T,>(columns: Array<any>): ExportColumn[] => {
  return columns
    .filter((column) => {
      const id = column?.id
      if (id === "select" || id === "srNo" || id === "edit" || id === "actions") return false
      return Boolean(column?.accessorKey || column?.accessorFn || id)
    })
    .map((column) => {
      const header =
        typeof column?.header === "string"
          ? column.header
          : column?.accessorKey || column?.id || "value"
      return {
        key: column?.accessorKey || column?.id || "value",
        header,
      }
    })
}

export const downloadCsv = <T,>(rows: T[], columns: ExportColumn[], fileName = "table-data") => {
  if (!rows.length || !columns.length) return

  const headerLine = columns.map((column) => escapeCsvValue(column.header)).join(",")
  const bodyLines = rows.map((row) => {
    return columns
      .map((column) => {
        const value = (row as Record<string, unknown>)[column.key]
        return escapeCsvValue(value)
      })
      .join(",")
  })

  const csvContent = [headerLine, ...bodyLines].join("\n")
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${fileName}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
