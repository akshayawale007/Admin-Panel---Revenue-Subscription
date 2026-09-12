"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import ConfirmDialog from "./ConfirmDialog"
import type { WhatsAppMessageType } from "@/lib/revenue/types"

const toastOpts = { autoClose: 3000 } as const

export const WHATSAPP_TEMPLATES: Record<WhatsAppMessageType, (name: string, extra?: string) => string> = {
  renewal_reminder: (name) =>
    `Hi ${name}, your Yoco Stays subscription is due for renewal. Please complete payment to avoid interruption.`,
  plan_approved: (name) => `Hi ${name}, your plan request has been approved. Welcome aboard.`,
  plan_rejected: (name, extra) =>
    `Hi ${name}, your plan request was not approved.${extra ? ` Reason: ${extra}` : ""}`,
  on_hold: (name) => `Hi ${name}, we need more info — our admin will contact you.`,
  invoice_sent: (name) => `Hi ${name}, your invoice has been generated. Please find the details in the admin panel.`,
  grace_period_warning: (name) =>
    `Hi ${name}, your subscription is in the grace period. Please renew to restore full access.`,
  module_locked: (name) =>
    `Hi ${name}, modules for your hostel have been locked because the subscription expired.`,
}

type Args = {
  adminName: string
  phone: string
  type: WhatsAppMessageType
  extra?: string
  onSent?: () => void
}

export function useWhatsAppSend() {
  const [open, setOpen] = useState(false)
  const [args, setArgs] = useState<Args | null>(null)

  const requestSend = (next: Args) => {
    setArgs(next)
    setOpen(true)
  }

  const preview = args
    ? WHATSAPP_TEMPLATES[args.type](args.adminName, args.extra)
    : ""

  const dialog = (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={`Send WhatsApp to ${args?.adminName ?? ""} at ${args?.phone ?? ""}?`}
      description={<p className="rounded-md bg-(--yoco-surface-muted) p-3 text-(--yoco-text)">{preview}</p>}
      confirmLabel="Send"
      onConfirm={() => {
        if (!args) return
        toast.success(`WhatsApp sent to ${args.adminName}`, toastOpts)
        args.onSent?.()
      }}
    />
  )

  return { requestSend, dialog }
}

export default function WhatsAppSendToast() {
  return null
}
