"use client"

import { useEffect, useMemo, useState } from "react"
import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"
import YocoSelect from "@/component/Common/Select/YocoSelect"
import InvoiceDiscountFields, { type DiscountMode } from "@/component/Revenue/Shared/InvoiceDiscountFields"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_CATALOG, MODULE_PILL_CURRENT, TIER_ORDER } from "@/lib/revenue/constants"
import {
  billedRateFor,
  billingCycleEndDate,
  billingCycleLabel,
  calcPeriodValue,
  defaultInvoiceDueDate,
  formatINR,
  gstRatesFromSettings,
  invoiceTotalsFromGross,
  matchBillingCycle,
  periodMonthsFromDates,
  planLabel,
} from "@/lib/revenue/utils"
import type { BillingCycle, HostelSubscription, PlanTier } from "@/lib/revenue/types"
import dayjs from "dayjs"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(9rem,1fr)_minmax(0,1.4fr)] items-center gap-3 border-b border-(--yoco-border-subtle)/60 py-2">
      <p className="text-sm text-(--yoco-text-muted)">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default function ManualInvoiceModal({
  open,
  setOpen,
  hostel,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  hostel: HostelSubscription
}) {
  const { createManualInvoice, settings, planRates, customModuleRates, planModules } = useRevenue()
  const pricing = { planRates, customModuleRates, planModules }
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState<"paid" | "unpaid">("unpaid")
  const [cycle, setCycle] = useState<BillingCycle | "">("")
  const [plan, setPlan] = useState<PlanTier>(hostel.plan ?? "ELITE")
  const [students, setStudents] = useState(String(hostel.studentCount))
  const [rate, setRate] = useState("")
  const [start, setStart] = useState(hostel.subscriptionStartDate)
  const [end, setEnd] = useState(hostel.renewalDate)
  const [modules, setModules] = useState<string[]>(hostel.activeModules)
  const [notes, setNotes] = useState("")
  const [gross, setGross] = useState("")
  const [grossDirty, setGrossDirty] = useState(false)
  const [sameState, setSameState] = useState(true)
  const [discountMode, setDiscountMode] = useState<DiscountMode>("none")
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")

  useEffect(() => {
    if (!open) return
    const nextPlan = hostel.plan ?? "ELITE"
    const nextModules = hostel.activeModules
    const nextRate = billedRateFor(nextPlan, nextModules, pricing)
    const nextStart = hostel.subscriptionStartDate
    const nextEnd = hostel.renewalDate
    const suggested = calcPeriodValue(
      hostel.studentCount,
      nextRate,
      periodMonthsFromDates(nextStart, nextEnd),
      "active"
    )
    setDueDate(defaultInvoiceDueDate(dayjs().format("YYYY-MM-DD")))
    setStatus("unpaid")
    setCycle(matchBillingCycle(nextStart, nextEnd) || hostel.billingCycle || "")
    setPlan(nextPlan)
    setStudents(String(hostel.studentCount))
    setRate(String(nextRate))
    setStart(nextStart)
    setEnd(nextEnd)
    setModules(nextModules)
    setNotes("")
    setGross(suggested ? String(suggested) : "")
    setGrossDirty(false)
    setSameState(true)
    setDiscountMode("none")
    setDiscountValue("")
    setDiscountReason("")
    // pricing object is derived from hostel/open reset only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hostel])

  const seatCount = Number(students) || 0
  const rateValue = Number(rate) || 0
  const months = periodMonthsFromDates(start, end)
  const suggestedGross = calcPeriodValue(seatCount, rateValue, months, "active")

  useEffect(() => {
    if (!open || grossDirty) return
    setGross(suggestedGross ? String(suggestedGross) : "")
  }, [open, grossDirty, suggestedGross])

  const grossAmount = Number(gross) || 0
  const parsedDiscount = Number(discountValue) || 0
  const hasDiscount = discountMode !== "none" && parsedDiscount > 0
  const totals = useMemo(
    () =>
      invoiceTotalsFromGross({
        gross: grossAmount,
        discountType: hasDiscount ? discountMode : undefined,
        discountValue: hasDiscount ? parsedDiscount : undefined,
        sameState,
        gstRate: settings.gstRate,
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
      }),
    [grossAmount, hasDiscount, discountMode, parsedDiscount, sameState, settings]
  )
  const { gstRate, cgstRate, sgstRate } = gstRatesFromSettings(settings)
  const invalidPeriod = !start || !end || !dayjs(end).isAfter(dayjs(start), "day")
  const invalidDiscount =
    hasDiscount && (discountMode === "percent" ? parsedDiscount > 100 : parsedDiscount > grossAmount)
  const canSave = grossAmount > 0 && seatCount > 0 && Boolean(dueDate) && !invalidPeriod && !invalidDiscount

  const applyCycle = (next: BillingCycle | "") => {
    setCycle(next)
    if (next && start) setEnd(billingCycleEndDate(start, next))
  }

  const applyStart = (nextStart: string) => {
    setStart(nextStart)
    if (cycle && nextStart) setEnd(billingCycleEndDate(nextStart, cycle))
  }

  const applyEnd = (nextEnd: string) => {
    setEnd(nextEnd)
    setCycle(start && nextEnd ? matchBillingCycle(start, nextEnd) : "")
  }

  const toggleModule = (key: string) => {
    setModules((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <Modal open={open} setOpen={setOpen} width="3xl" height="90vh">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <p className="yoco-form-title text-base">INVOICE</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-(--yoco-text-muted)">Bill to</p>
            <p className="font-bold">{hostel.name}</p>
            <p>
              {hostel.city}, {hostel.state}
            </p>
            <p>{hostel.hostelCode}</p>
            <p>
              {hostel.adminName} · {hostel.adminPhone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{settings.companyName}</p>
            <p className="text-xs text-(--yoco-text-muted)">GSTIN: {settings.gstin}</p>
            <p className="text-xs text-(--yoco-text-muted)">{settings.companyAddress}</p>
          </div>
        </div>

        <div className="mt-6">
          <Field label="Due date">
            <input type="date" className="yoco-input w-full px-3 py-2 text-right" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Status">
            <YocoSelect
              fullWidth
              ariaLabel="Status"
              value={status}
              onChange={(v) => setStatus(v as "paid" | "unpaid")}
              options={[
                { value: "unpaid", label: "Unpaid" },
                { value: "paid", label: "Paid" },
              ]}
            />
          </Field>
          <Field label="Billing cycle">
            <YocoSelect
              fullWidth
              ariaLabel="Billing cycle"
              value={cycle || "custom"}
              onChange={(v) => applyCycle(v === "custom" ? "" : (v as BillingCycle))}
              options={[
                { value: "QUARTERLY", label: billingCycleLabel("QUARTERLY") },
                { value: "SEMIANNUAL", label: billingCycleLabel("SEMIANNUAL") },
                { value: "ANNUAL", label: billingCycleLabel("ANNUAL") },
                { value: "custom", label: "Custom" },
              ]}
            />
          </Field>
          <Field label="Plan">
            <YocoSelect
              fullWidth
              ariaLabel="Plan"
              value={plan}
              onChange={(v) => {
                const next = v as PlanTier
                setPlan(next)
                const nextModules = next === "CUSTOM" ? modules : planModules[next]
                setModules(nextModules)
                setRate(String(billedRateFor(next, nextModules, pricing)))
              }}
              options={TIER_ORDER.map((tier) => ({ value: tier, label: planLabel(tier) }))}
            />
          </Field>
          <Field label="Number of seats billed">
            <input
              type="number"
              min={1}
              className="yoco-input w-full px-3 py-2 text-right"
              value={students}
              onChange={(e) => setStudents(e.target.value)}
            />
          </Field>
          <Field label="Rate per seat per month">
            <input
              type="number"
              min={0}
              className="yoco-input w-full px-3 py-2 text-right"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </Field>
          <Field label="Billing period">
            <div className="flex items-center justify-end gap-2">
              <input type="date" className="yoco-input px-3 py-2" value={start} onChange={(e) => applyStart(e.target.value)} />
              <span className="text-(--yoco-text-muted)">–</span>
              <input type="date" className="yoco-input px-3 py-2" value={end} onChange={(e) => applyEnd(e.target.value)} />
            </div>
          </Field>
          <Field label="Active modules">
            <div className="flex flex-wrap justify-end gap-1.5">
              {MODULE_CATALOG.map((mod) => {
                const on = modules.includes(mod.key)
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggleModule(mod.key)}
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                      on ? MODULE_PILL_CURRENT : "bg-(--yoco-surface-muted) text-(--yoco-text-muted) opacity-50"
                    }`}
                  >
                    {mod.name}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="Description">
            <textarea
              className="yoco-input min-h-16 w-full px-3 py-2 text-right"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <Field label="Subtotal before GST">
            <input
              type="number"
              min={1}
              className="yoco-input w-full px-3 py-2 text-right"
              value={gross}
              onChange={(e) => {
                setGrossDirty(true)
                setGross(e.target.value)
              }}
            />
          </Field>
          <div className="py-2">
            <InvoiceDiscountFields
              mode={discountMode}
              value={discountValue}
              reason={discountReason}
              onModeChange={setDiscountMode}
              onValueChange={setDiscountValue}
              onReasonChange={setDiscountReason}
            />
          </div>
          {totals.discountOff > 0 ? (
            <>
              <Field label="Taxable amount">
                <p className="text-right font-semibold">{formatINR(totals.taxable)}</p>
              </Field>
            </>
          ) : null}
          {sameState ? (
            <>
              <Field label={`CGST (${cgstRate}%)`}>
                <div className="flex items-center justify-end gap-2">
                  <p className="font-semibold">{formatINR(totals.cgst)}</p>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-(--yoco-primary)"
                    onClick={() => setSameState(false)}
                  >
                    Use IGST
                  </button>
                </div>
              </Field>
              <Field label={`SGST (${sgstRate}%)`}>
                <p className="text-right font-semibold">{formatINR(totals.sgst)}</p>
              </Field>
            </>
          ) : (
            <Field label={`IGST (${gstRate}%)`}>
              <div className="flex items-center justify-end gap-2">
                <p className="font-semibold">{formatINR(totals.igst)}</p>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-(--yoco-primary)"
                  onClick={() => setSameState(true)}
                >
                  Use CGST+SGST
                </button>
              </div>
            </Field>
          )}
          <div className="flex items-center justify-between border-t border-(--yoco-border-subtle) py-2 font-bold">
            <span>Total amount due</span>
            <span>{formatINR(totals.total)}</span>
          </div>
        </div>

        {invalidDiscount ? (
          <p className="mt-2 text-xs font-semibold text-rose-500">
            {discountMode === "percent" ? "Percentage cannot exceed 100." : "Flat discount cannot exceed the subtotal."}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button title="Cancel" variant="secondary" onClick={() => setOpen(false)} />
          <Button
            title="Create invoice"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              createManualInvoice(hostel.hostelId, {
                notes: notes.trim(),
                billingPeriodStart: start,
                billingPeriodEnd: end,
                students: seatCount,
                plan,
                rate: rateValue,
                modules,
                billingCycle: cycle || undefined,
                grossAmount,
                sameState,
                dueDate,
                status,
                discountType: hasDiscount ? discountMode : undefined,
                discountValue: hasDiscount ? parsedDiscount : undefined,
                discountReason: hasDiscount ? discountReason.trim() || undefined : undefined,
              })
              setOpen(false)
            }}
          />
        </div>
      </div>
    </Modal>
  )
}
