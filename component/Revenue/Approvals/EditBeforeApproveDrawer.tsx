"use client"

import { useEffect, useState } from "react"
import { Drawer, DrawerHeader, DrawerItems } from "flowbite-react"
import Button from "@/component/Common/Button/Button"
import ToggleSwitch from "@/component/Common/Toggle/Toggle"
import ConfirmDialog from "@/component/Revenue/Shared/ConfirmDialog"
import YocoSelect from "@/component/Common/Select/YocoSelect"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { MODULE_CATALOG, TIER_ORDER } from "@/lib/revenue/constants"
import { billedRateFor, customPlanRateBreakdown, formatRate, planLabel } from "@/lib/revenue/utils"
import type { HostelSubscription, PendingRequest, PlanTier } from "@/lib/revenue/types"

type Row = PendingRequest & { hostel: HostelSubscription }

export default function EditBeforeApproveDrawer({
  row,
  onClose,
}: {
  row: Row | null
  onClose: () => void
}) {
  const { updateHostel, approveRequest, addAudit, planRates, customModuleRates, planModules } = useRevenue()
  const [plan, setPlan] = useState<PlanTier>("PREMIUM")
  const [count, setCount] = useState(0)
  const [start, setStart] = useState("")
  const [renewal, setRenewal] = useState("")
  const [modules, setModules] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [confirmPlan, setConfirmPlan] = useState(false)

  useEffect(() => {
    if (!row) return
    setPlan((row.planRequested ?? row.hostel.plan ?? "PREMIUM") as PlanTier)
    setCount(row.studentCount ?? row.hostel.studentCount)
    setStart(row.hostel.subscriptionStartDate)
    setRenewal(row.hostel.renewalDate)
    setModules(row.hostel.activeModules)
    setNote("")
  }, [row])

  const pricing = { planRates, customModuleRates, planModules }
  const customRate = billedRateFor("CUSTOM", modules, pricing)
  const breakdown = customPlanRateBreakdown(modules, pricing)

  const save = () => {
    if (!row) return
    const doSave = () => {
      updateHostel(row.hostel.hostelId, {
        plan,
        studentCount: count,
        subscriptionStartDate: start,
        renewalDate: renewal,
        activeModules: modules,
        notes: note
          ? [
              {
                id: `n-${Date.now()}`,
                adminName: "Akshay Sharma",
                timestamp: new Date().toISOString(),
                text: note,
              },
              ...row.hostel.notes,
            ]
          : row.hostel.notes,
      })
      addAudit(row.hostel.hostelId, "Edited before approving")
      approveRequest(row.hostel.hostelId, row.id, undefined, { createInvoice: true })
      onClose()
    }
    if (row.hostel.plan && plan !== row.hostel.plan) {
      setConfirmPlan(true)
      return
    }
    doSave()
  }

  return (
    <>
      <Drawer open={Boolean(row)} onClose={onClose} position="right" className="w-full max-w-md">
        <DrawerHeader title="Edit before approving" />
        <DrawerItems>
          {row ? (
            <div className="flex flex-col gap-3 p-2">
              <label className="yoco-form-label">Plan tier</label>
              <YocoSelect
                fullWidth
                value={plan}
                onChange={(next) => setPlan(next as PlanTier)}
                ariaLabel="Plan tier"
                options={TIER_ORDER.map((tier) => ({
                  value: tier,
                  label:
                    tier === "CUSTOM"
                      ? `Custom — ${formatRate(customRate)}/mo`
                      : `${planLabel(tier)} — ${formatRate(planRates[tier])}`,
                }))}
              />
              <label className="yoco-form-label">Seat count</label>
              <input type="number" className="yoco-input px-3 py-2" value={count} onChange={(e) => setCount(Number(e.target.value))} />
              <label className="yoco-form-label">Subscription start</label>
              <input type="date" className="yoco-input px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
              <label className="yoco-form-label">Override renewal date</label>
              <input type="date" className="yoco-input px-3 py-2" value={renewal} onChange={(e) => setRenewal(e.target.value)} />
              <p className="yoco-form-label">Modules</p>
              {MODULE_CATALOG.map((m) => (
                <div key={m.key} className="flex items-center justify-between">
                  <span className="text-sm">{m.name}</span>
                  <ToggleSwitch
                    enabled={modules.includes(m.key)}
                    onChange={() =>
                      setModules((prev) => (prev.includes(m.key) ? prev.filter((k) => k !== m.key) : [...prev, m.key]))
                    }
                  />
                </div>
              ))}
              <label className="yoco-form-label">Internal note</label>
              <textarea className="yoco-input min-h-20 px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} />
              <p className="text-xs text-(--yoco-text-muted)">
                Custom rate {formatRate(customRate)}/seat/month
                {breakdown.extras.length
                  ? ` · extras: ${breakdown.extras.map((line) => `${line.key} ${formatRate(line.rate)}`).join(", ")}`
                  : ""}
              </p>
              <Button title="Save & mark approved" onClick={() => save()} />
            </div>
          ) : null}
        </DrawerItems>
      </Drawer>
      <ConfirmDialog
        open={confirmPlan}
        setOpen={setConfirmPlan}
        title={`Change plan from ${planLabel(row?.hostel.plan ?? null)} to ${planLabel(plan)} for ${row?.hostel.name}?`}
        onConfirm={() => {
          if (!row) return
          updateHostel(row.hostel.hostelId, {
            plan,
            studentCount: count,
            subscriptionStartDate: start,
            renewalDate: renewal,
            activeModules: modules,
          })
          approveRequest(row.hostel.hostelId, row.id, undefined, { createInvoice: true })
          onClose()
        }}
      />
    </>
  )
}
