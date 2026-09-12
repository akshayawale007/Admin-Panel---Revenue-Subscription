import dayjs from "dayjs"
import type { HostelSubscription, Invoice, InvoiceBreakdown, InvoiceType, PlanTier, PricingContext } from "./types"
import { addedModulesRate, billedRateFor, hostelRate, resolvePricing, roundRate } from "./pricing"
import { billingMonths, defaultInvoiceDueDate, gstBreakdown, isHigherTier, periodMonthsFromDates } from "./utils"

export type SubscriptionChangeInput = {
  plan: PlanTier | null
  addStudents: number
  modules: string[]
}

export type InvoiceDraft = Omit<Invoice, "id" | "invoiceNo">

export type SubscriptionChangeResult = {
  plan: PlanTier | null
  studentCount: number
  activatedStudentCount: number
  addedStudentCount: number
  modules: string[]
  contractRate: number
  invoices: InvoiceDraft[]
  descriptions: string[]
}

export type RemainingFractionOptions = {
  accessEndDate?: string
  useAccessWindow?: boolean
  periodStart?: string
}

export function remainingFraction(
  renewalDate: string,
  cycle: HostelSubscription["billingCycle"],
  options?: RemainingFractionOptions
) {
  const billedEnd = dayjs(renewalDate)
  const accessEnd = options?.accessEndDate ? dayjs(options.accessEndDate) : billedEnd
  const periodEnd = options?.useAccessWindow ? accessEnd : billedEnd
  const periodMonths = options?.periodStart
    ? periodMonthsFromDates(options.periodStart, periodEnd.format("YYYY-MM-DD"))
    : billingMonths(cycle)
  const now = dayjs()
  const inWindow = periodEnd.isAfter(now, "day")
  const rawMonths = inWindow ? periodEnd.diff(now, "month", true) : 0
  const monthsLeft = inWindow ? Math.max(1, Math.min(periodMonths, Math.ceil(rawMonths))) : 0
  return {
    monthsLeft,
    periodMonths,
    fraction: periodMonths ? monthsLeft / periodMonths : 0,
    periodEnd: periodEnd.format("YYYY-MM-DD"),
    inOriginalPeriod: options?.useAccessWindow ? inWindow : billedEnd.isAfter(now, "day"),
  }
}

export function studentAddCharge(added: number, rate: number, monthsLeft: number) {
  return Math.max(0, Math.round(added * rate * monthsLeft))
}

export function planUpgradeCharge(oldRate: number, newRate: number, billedStudents: number, monthsLeft: number) {
  return Math.max(0, Math.round((newRate - oldRate) * billedStudents * monthsLeft))
}

function draftInvoice(
  hostel: HostelSubscription,
  params: {
    type: InvoiceType
    amount: number
    students: number
    plan: PlanTier | null
    rate: number
    modules: string[]
    gstRate: number
    cgstRate?: number
    sgstRate?: number
    breakdown: InvoiceBreakdown
    periodEnd: string
  }
): InvoiceDraft {
  const gst = gstBreakdown(params.amount, true, params.gstRate, {
    cgstRate: params.cgstRate,
    sgstRate: params.sgstRate,
  })
  const dateGenerated = dayjs().format("YYYY-MM-DD")
  return {
    billingPeriodStart: dateGenerated,
    billingPeriodEnd: params.periodEnd,
    students: params.students,
    amount: params.amount,
    gst: gst.gst,
    total: gst.total,
    status: "unpaid",
    dateGenerated,
    sameState: true,
    dueDate: defaultInvoiceDueDate(dateGenerated),
    modules: params.modules,
    plan: params.plan,
    rate: params.rate,
    invoiceType: params.type,
    billingCycle: hostel.billingCycle,
    invoiceBreakdown: params.breakdown,
  }
}

export type MidCycleChangeOptions = {
  pricing?: PricingContext
  isTrial?: boolean
  inGrace?: boolean
  accessEndDate?: string
  cgstRate?: number
  sgstRate?: number
}

export function computeMidCycleChange(
  hostel: HostelSubscription,
  input: SubscriptionChangeInput,
  gstRate: number,
  options?: MidCycleChangeOptions
): SubscriptionChangeResult {
  const pricing = resolvePricing(options?.pricing)
  const oldPlan = hostel.plan
  const billedCount = hostel.studentCount
  const activated = hostel.activatedStudentCount ?? billedCount
  const previouslyAdded = hostel.addedStudentCount ?? Math.max(0, billedCount - activated)
  const period = remainingFraction(hostel.renewalDate, hostel.billingCycle, {
    accessEndDate: options?.accessEndDate,
    useAccessWindow: Boolean(options?.inGrace),
    periodStart: hostel.subscriptionStartDate,
  })
  const addStudents = period.inOriginalPeriod && !options?.isTrial ? Math.max(0, Math.round(input.addStudents)) : 0
  const oldModules = hostel.activeModules
  let nextPlan = input.plan
  const nextCount = billedCount + addStudents
  const nextModules = [...input.modules]
  const descriptions: string[] = []
  const invoices: InvoiceDraft[] = []

  const addedModules = nextModules.filter((key) => !oldModules.includes(key))
  if (addedModules.length) {
    nextPlan = "CUSTOM"
  }

  const planUpgraded = Boolean(oldPlan && nextPlan && nextPlan !== "CUSTOM" && isHigherTier(nextPlan, oldPlan))
  const { monthsLeft, periodMonths, periodEnd } = period
  const oldRate = hostelRate(hostel)
  const addedRate = addedModules.length ? addedModulesRate(addedModules, pricing) : 0
  let nextContract = oldRate
  if (options?.isTrial) {
    nextContract = 0
  } else if (planUpgraded && nextPlan) {
    nextContract = billedRateFor(nextPlan, nextModules, pricing)
  } else if (addedModules.length) {
    nextContract = roundRate(oldRate + addedRate)
  }
  const skipInvoices = Boolean(options?.isTrial)
  const taxRates = { cgstRate: options?.cgstRate, sgstRate: options?.sgstRate }

  if (!skipInvoices && planUpgraded && nextPlan) {
    const charge = planUpgradeCharge(oldRate, nextContract, billedCount, monthsLeft)
    invoices.push(
      draftInvoice(hostel, {
        type: "mid_cycle_plan_upgrade",
        amount: charge,
        students: billedCount,
        plan: nextPlan,
        rate: nextContract,
        modules: nextModules,
        gstRate,
        ...taxRates,
        periodEnd,
        breakdown: {
          billedStudentCount: billedCount,
          originalStudentCount: activated,
          addedStudentCount: previouslyAdded,
          previousPlan: oldPlan,
          newPlan: nextPlan,
          previousRate: oldRate,
          newRate: nextContract,
          monthsRemaining: monthsLeft,
          periodMonths,
          charge,
        },
      })
    )
    descriptions.push(`Plan upgraded to ${nextPlan} — difference invoice generated`)
  }

  if (!skipInvoices && addStudents > 0) {
    const seatRate = planUpgraded ? nextContract : oldRate
    const charge = studentAddCharge(addStudents, seatRate, monthsLeft)
    invoices.push(
      draftInvoice(hostel, {
        type: "mid_cycle_student_upgrade",
        amount: charge,
        students: addStudents,
        plan: nextPlan,
        rate: seatRate,
        modules: nextModules,
        gstRate,
        ...taxRates,
        periodEnd,
        breakdown: {
          originalStudentCount: activated,
          addedStudentCount: addStudents,
          billedStudentCount: nextCount,
          previousPlan: oldPlan,
          newPlan: nextPlan,
          previousRate: oldRate,
          newRate: seatRate,
          monthsRemaining: monthsLeft,
          periodMonths,
          charge,
        },
      })
    )
    descriptions.push(`Added ${addStudents} seats — invoice generated`)
  }

  if (!skipInvoices && addedModules.length && !planUpgraded) {
    const charge = planUpgradeCharge(oldRate, nextContract, nextCount, monthsLeft)
    invoices.push(
      draftInvoice(hostel, {
        type: "custom_module_addition",
        amount: charge,
        students: nextCount,
        plan: nextPlan,
        rate: nextContract,
        modules: nextModules,
        gstRate,
        ...taxRates,
        periodEnd,
        breakdown: {
          billedStudentCount: nextCount,
          originalStudentCount: activated,
          addedStudentCount: addStudents,
          previousPlan: oldPlan,
          newPlan: nextPlan,
          previousRate: oldRate,
          newRate: nextContract,
          monthsRemaining: monthsLeft,
          periodMonths,
          charge,
          addedModules,
          addedModuleRates: addedModules.map((key) => ({
            key,
            rate: pricing.customModuleRates[key] ?? 0,
          })),
        },
      })
    )
    descriptions.push(`Custom modules added (${addedModules.join(", ")}) — invoice generated`)
  }

  if (skipInvoices && addedModules.length) {
    descriptions.push(`Custom modules added (${addedModules.join(", ")}) — no charge during trial`)
  } else if (!invoices.length) {
    descriptions.push(skipInvoices ? "Subscription updated — no charge during trial" : "Subscription updated")
  }

  return {
    plan: nextPlan,
    studentCount: nextCount,
    activatedStudentCount: activated,
    addedStudentCount: previouslyAdded + addStudents,
    modules: nextModules,
    contractRate: nextContract,
    invoices,
    descriptions,
  }
}
