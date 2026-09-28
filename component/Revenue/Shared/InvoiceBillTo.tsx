"use client"

import { useHostel } from "@/component/Hostel/HostelProvider"
import type { HostelSubscription } from "@/lib/revenue/types"

export type InvoiceBillToOverride = {
  address?: string
  contactName?: string
  contactMobile?: string
}

export function formatHostelAddress(parts: {
  address?: string
  landmark?: string
  city?: string
  state?: string
  pincode?: string
}) {
  const street = [parts.address, parts.landmark].filter(Boolean).join(", ")
  const place = [parts.city, parts.state].filter(Boolean).join(", ")
  const locality = [place, parts.pincode].filter(Boolean).join(" ")
  return [street, locality].filter(Boolean).join(", ")
}

export default function InvoiceBillTo({
  hostel,
  override,
}: {
  hostel: Pick<HostelSubscription, "hostelId" | "_id" | "name" | "city" | "state">
  override?: InvoiceBillToOverride
}) {
  const { getHostel } = useHostel()
  const record = override ? undefined : getHostel(hostel.hostelId || hostel._id)
  const address =
    override?.address ||
    (record
      ? formatHostelAddress({
          address: record.address,
          landmark: record.landmark,
          city: record.city?.name || record.city?.label,
          state: record.state?.name || record.state?.label,
          pincode: record.pincode,
        })
      : [hostel.city, hostel.state].filter(Boolean).join(", "))
  const contactName = override?.contactName || record?.contactName1 || "—"
  const contactMobile = override?.contactMobile || record?.contactMobile1 || "—"

  return (
    <div>
      <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Bill to</p>
      <p className="font-bold">{hostel.name}</p>
      <p>{address || "—"}</p>
      <p>{contactName}</p>
      <p>{contactMobile}</p>
    </div>
  )
}
