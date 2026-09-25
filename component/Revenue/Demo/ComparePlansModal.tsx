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
    <Modal
      open={open}
      setOpen={setOpen}
      width="5xl"
      height="fit"
      contentClassName="px-4 py-4"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold">Compare plans</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-sm font-semibold text-(--yoco-text-muted) hover:bg-(--yoco-surface-muted)"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-auto overflow-y-auto">
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
      </div>
    </Modal>
  )
}
