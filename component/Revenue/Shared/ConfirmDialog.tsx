"use client"

import { useEffect, useState, type ReactNode } from "react"
import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"

type ConfirmDialogProps = {
  open: boolean
  setOpen: (v: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  noteEnabled?: boolean
  noteRequired?: boolean
  noteLabel?: string
  onConfirm: (note?: string) => void
  secondaryConfirmLabel?: string
  onSecondaryConfirm?: (note?: string) => void
}

export default function ConfirmDialog({
  open,
  setOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  noteEnabled,
  noteRequired,
  noteLabel = "Note",
  onConfirm,
  secondaryConfirmLabel,
  onSecondaryConfirm,
}: ConfirmDialogProps) {
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) setNote("")
  }, [open])

  const canConfirm = !noteRequired || Boolean(note.trim())

  return (
    <Modal open={open} setOpen={setOpen} width="md">
      <div className="p-5">
        <p className="yoco-form-title text-base">{title}</p>
        {description ? (
          <div className="mt-3 text-sm text-(--yoco-text-muted)">{description}</div>
        ) : null}
        {noteEnabled ? (
          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
              {noteLabel}
              {noteRequired ? " *" : " (optional)"}
            </span>
            <textarea
              className="yoco-input min-h-20 px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={noteRequired ? "Reason required" : "Add a note for history"}
            />
          </label>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button title={cancelLabel} variant="secondary" onClick={() => setOpen(false)} />
          {secondaryConfirmLabel && onSecondaryConfirm ? (
            <Button
              title={secondaryConfirmLabel}
              variant="secondary"
              disabled={!canConfirm}
              onClick={() => {
                if (!canConfirm) return
                onSecondaryConfirm(note.trim() || undefined)
                setOpen(false)
              }}
            />
          ) : null}
          <Button
            title={confirmLabel}
            variant={danger ? "danger" : "primary"}
            disabled={!canConfirm}
            onClick={() => {
              if (!canConfirm) return
              onConfirm(note.trim() || undefined)
              setOpen(false)
            }}
          />
        </div>
      </div>
    </Modal>
  )
}
