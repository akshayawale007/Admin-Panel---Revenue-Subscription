"use client"

import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"

const sections = [
  {
    title: "Revenue — Compare plans",
    items: [
      "The compare-plans popup fills the browser height and stays inside the window. Extra modules scroll inside the sheet.",
      "Plan cards, prices, buttons, and the module table are slightly smaller so the current list fits from top to bottom.",
      "The line under each module name is removed. The header row still separates the column titles.",
      "The popup is wide enough for the four plan cards. The current plan’s highlight border is fully visible and is no longer cut off at the edges.",
    ],
  },
  {
    title: "Hostel — Add hostel (Subscription)",
    items: [
      "Trial period is one header, with the switch directly beside it. The days box sits under that header, with no second heading.",
      "Billing period is on that same row, lined up above Seat count (Staff).",
      "Trial days, billing period, student seats, and staff seats share one height and are 42% shorter.",
      "The trial switch is shorter and slightly taller.",
      "Turning trial off sets the billing period to today through one month later, so the required-date message does not appear.",
      "Discount is no longer on Add hostel. Trial length is the days field on this form. With a trial length set, past dates stay locked and future months stay open.",
      "Saving a new hostel creates the first invoice and one approved new-subscription request.",
      "View invoice previews the first invoice before save. Invoice number and upgrade request id show “Assigned on save”. The button stays off until the billing period is valid, and until trial days are set when trial is on.",
    ],
  },
  {
    title: "Revenue — Settings",
    items: ["Trial days, invoice prefix, and the starting invoice sequence are removed from Settings."],
  },
  {
    title: "Revenue — Hostel invoices",
    items: [
      "Invoice numbers use the yoco/inv/ prefix with the Indian financial-year series, such as yoco/inv/2026-27/0001.",
      "Tax is CGST and SGST only. Discount comes off the subtotal before GST.",
      "Preview and PDF show, in order: Subtotal before GST, Discount, Taxable amount, CGST and SGST on the taxable amount, Total.",
      "Upgrade request ID is a row on the invoice and in the PDF. Sample invoices use that hostel’s request id when one exists. Manual invoices show —.",
      "Create invoice has no status control and always saves as unpaid. Edit invoice changes only the discount and the reason. Paid and unpaid change only from Mark as paid and Mark as unpaid.",
      "Dropdowns inside the invoice form open in the correct place.",
      "The invoice list shows an Up. Req. Id column. Manual invoices, and invoices with no request, show —.",
      "Download PDF prints the invoice sheet.",
    ],
  },
  {
    title: "Revenue — Approvals and upgrade requests",
    items: [
      "Covers the approvals queue, the hostel upgrade-requests tab, and edit-before-approve.",
      "Each request has a public id such as UR-0001.",
      "Mark as approved updates the subscription and creates an invoice stamped with that request id.",
      "The approvals queue shows Request ID. The hostel upgrade-requests tab shows Up. Req. Id. Both lists put the newest request first. Opening a request shows Request ID.",
      "Mark as approved asks for confirmation before the subscription updates and the invoice is created. Edit before approve does the same.",
    ],
  },
  {
    title: "Revenue — Renewal alerts",
    items: [
      "Confirming a renewal creates an invoice linked to a new upgrade request.",
      "The preview before confirm shows “Assigned on save” for the invoice number and request id.",
    ],
  },
  {
    title: "Revenue — Upgrade subscription",
    items: [
      "For a deactivated hostel, Start as a trial includes a trial-days field. It defaults to 30 days and is the length used on that request.",
    ],
  },
]

export default function Page() {
  return (
    <LayoutWrapper navbar={<AppNavbar title="Latest changes" />}>
      <div className="yoco-page-card min-h-0">
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-col gap-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-sm font-semibold text-(--yoco-text)">{section.title}</h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-(--yoco-text-muted)">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}
