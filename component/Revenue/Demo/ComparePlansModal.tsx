"use client"

import Modal from "@/component/Common/Modal/Modal"
import ComparePlansView from "@/component/Revenue/Demo/ComparePlansView"
import type { PlanModuleConfig, PlanTier } from "@/lib/revenue/types"

type ComparePlansModalProps = {
  open: boolean
  setOpen: (open: boolean) => void
  currentPlan: PlanTier | null
  planModules: PlanModuleConfig
  canChoose?: boolean
  canChooseCustom?: boolean
  allowRenewCurrent?: boolean
  allowDowngrade?: boolean
  onChoosePlan?: (tier: PlanTier) => void
}

export default function ComparePlansModal({
  open,
  setOpen,
  currentPlan,
  planModules,
  canChoose = false,
  canChooseCustom = false,
  allowRenewCurrent = false,
  allowDowngrade = true,
  onChoosePlan,
}: ComparePlansModalProps) {
  return (
    <Modal open={open} setOpen={setOpen} width="5xl" height="90vh">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-lg font-semibold">Compare plans</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-(--yoco-text-muted) hover:bg-(--yoco-surface-muted)"
          >
            Close
          </button>
        </div>
        <ComparePlansView
          currentPlan={currentPlan}
          planModules={planModules}
          canChoose={canChoose}
          canChooseCustom={canChooseCustom}
          allowRenewCurrent={allowRenewCurrent}
          allowDowngrade={allowDowngrade}
          onChoosePlan={onChoosePlan}
        />
      </div>
    </Modal>
  )
}
