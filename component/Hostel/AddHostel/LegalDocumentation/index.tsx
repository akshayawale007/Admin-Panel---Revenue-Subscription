"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"
import { toast } from "react-toastify"
import { useHostel } from "@/component/Hostel/HostelProvider"

const LegalDocumentation = () => {
  const { draftDocs, setDraftDocs } = useHostel()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf")
    const oversized = pdfFiles.filter((file) => file.size > 2 * 1024 * 1024)
    if (oversized.length > 0) {
      toast.error("Each PDF file must be under 2MB")
      e.target.value = ""
      return
    }
    const existingNames = new Set(draftDocs.map((f) => f.name))
    const unique = pdfFiles.filter((file) => !existingNames.has(file.name))
    if (unique.length === 0) {
      toast.error("File(s) already added")
      e.target.value = ""
      return
    }
    if (draftDocs.length + unique.length > 5) {
      toast.error("Maximum 5 PDF files allowed")
      e.target.value = ""
      return
    }
    const added = unique.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }))
    setDraftDocs((prev) => [...prev, ...added])
    e.target.value = ""
  }

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Legal Documentation</p>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-normal">Documents</label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              className="yoco-form-input-field px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-(--yoco-surface) file:px-3 file:py-1 file:text-xs file:font-semibold file:text-(--yoco-text) hover:file:bg-(--yoco-row-hover)"
            />
            <p className="text-xs text-(--yoco-text-muted)">Upload up to 5 PDF files only</p>
          </div>
          {draftDocs.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {draftDocs.map((file, i) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded border border-(--yoco-border-subtle) bg-(--yoco-surface) px-3 py-2"
                >
                  <span
                    onClick={() => {
                      if (file.url) window.open(file.url, "_blank", "noopener,noreferrer")
                    }}
                    className="cursor-pointer truncate text-xs text-(--yoco-text)"
                  >
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftDocs((prev) => prev.filter((_, idx) => idx !== i))}
                    className="ml-2 shrink-0 cursor-pointer text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default LegalDocumentation
