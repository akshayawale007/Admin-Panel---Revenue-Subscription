import dayjs from "dayjs"
import type {
  BillingCycle,
  HostelSubscription,
  InvoiceDiscountType,
  ModuleCatalogItem,
  PlanTier,
  PricingContext,
  StandardPlanTier,
  SubscriptionStatus,
  UpcomingKind,
} from "./types"
import { DEFAULT_SETTINGS, MODULE_CATALOG, STANDARD_TIERS, TIER_ORDER } from "./constants"
import { billedRateFor } from "./pricing"

export { addedModulesRate, billedRateFor, customPlanMonthlyRate, customPlanRateBreakdown, formatRate, hostelRate, rateForPlan, roundRate } from "./pricing"

export const formatINR = (amount: number): string => {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
  return `₹${formatted}`
}

export const formatDate = (value?: string | Date | null): string => {
  if (!value) return "—"
  const d = dayjs(value)
  if (!d.isValid()) return "—"
  return d.format("DD MMM YYYY")
}

export const formatDateTime = (value?: string | Date | null): string => {
  if (!value) return "—"
  const d = dayjs(value)
  if (!d.isValid()) return "—"
  return d.format("DD MMM YYYY, HH:mm")
}

export const planLabel = (plan?: PlanTier | null): string => {
  if (!plan) return "—"
  if (plan === "PREMIUM") return "Premium"
  if (plan === "ADVANCED") return "Advanced"
  if (plan === "ELITE") return "Elite"
  return "Custom"
}

export const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    active: "Active",
    trial: "Trial",
    expired: "Expired",
    deactivated: "Deactivated",
    pending: "Pending",
    voided: "Voided",
    on_hold: "On Hold",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
    unpaid: "Unpaid",
    grace: "Grace",
  }
  return map[status] ?? status
}

export const invoiceTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    annual_subscription: "Annual subscription",
    mid_cycle_student_upgrade: "Mid-plan billing period seat upgrade",
    mid_cycle_plan_upgrade: "Mid-plan plan upgrade",
    custom_module_addition: "Custom module addition",
    manual: "Manual invoice",
  }
  return map[type] ?? type
}

export const requestTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    plan_upgrade: "Plan upgrade",
    plan_downgrade: "Plan downgrade",
    student_count_update: "Seat count update",
    module_add_remove: "Module add/remove",
    grace_period_extension: "Grace period extension",
    new_subscription: "New subscription",
    renewal_after_expiry: "Renewal after expiry",
  }
  return map[type] ?? type
}

export const billingMonths = (cycle: BillingCycle): number => {
  if (cycle === "QUARTERLY") return 4
  if (cycle === "SEMIANNUAL") return 6
  return 12
}

export const billingCycleLabel = (cycle?: BillingCycle | null): string => {
  if (cycle === "QUARTERLY") return "Quarterly"
  if (cycle === "SEMIANNUAL") return "Semiannual"
  if (cycle === "ANNUAL") return "Annual"
  return "—"
}

export const invoicePeriodCycleLabel = (start: string, end: string): string => {
  const matched = matchBillingCycle(start, end)
  return matched ? billingCycleLabel(matched) : "Custom"
}

export const invoicePlanDisplay = (invoice: { invoiceType: string; plan?: PlanTier | null }): string => {
  if (invoice.invoiceType === "mid_cycle_student_upgrade") return "Seat increase"
  if (invoice.invoiceType === "manual") return invoice.plan ? `Manual · ${planLabel(invoice.plan)}` : "Manual"
  if (invoice.invoiceType === "custom_module_addition" || invoice.plan === "CUSTOM") return "Custom plan"
  return planLabel(invoice.plan)
}

export const defaultInvoiceDueDate = (generatedOn: string): string =>
  dayjs(generatedOn).add(10, "day").format("YYYY-MM-DD")

export const billingCycleEndDate = (start: string, cycle: BillingCycle): string =>
  dayjs(start).add(billingMonths(cycle), "month").format("YYYY-MM-DD")

export const periodMonthsFromDates = (start: string, end: string): number => {
  const from = dayjs(start)
  const to = dayjs(end)
  if (!from.isValid() || !to.isValid() || !to.isAfter(from, "day")) return 0
  return Math.max(1, Math.round(to.diff(from, "month", true)))
}

export const matchBillingCycle = (start: string, end: string): BillingCycle | "" => {
  const cycles: BillingCycle[] = ["QUARTERLY", "SEMIANNUAL", "ANNUAL"]
  return cycles.find((cycle) => billingCycleEndDate(start, cycle) === end) ?? ""
}

export const calcARR = (
  studentCount: number,
  rate: number,
  status?: string
): number => {
  if (status === "trial" || status === "expired" || status === "deactivated" || !rate) return 0
  return studentCount * rate * 12
}

export const calcPeriodValue = (
  studentCount: number,
  rate: number,
  months: number,
  status?: string
): number => {
  if (status === "trial" || status === "expired" || status === "deactivated" || !rate || months <= 0) return 0
  return Math.round(studentCount * rate * months)
}

export const calcContractValue = (
  studentCount: number,
  rate: number,
  cycle: BillingCycle,
  status?: string
): number => calcPeriodValue(studentCount, rate, billingMonths(cycle), status)

export const calcProRation = (
  oldCount: number,
  newCount: number,
  rate: number,
  monthsRemaining: number,
  cycle: BillingCycle
): number => {
  const periodMonths = billingMonths(cycle)
  return (newCount - oldCount) * rate * (monthsRemaining / periodMonths)
}

export const moduleByKey = (key: string): ModuleCatalogItem | undefined =>
  MODULE_CATALOG.find((m) => m.key === key)

export const requiredTierForModule = (key: string): PlanTier =>
  moduleByKey(key)?.minTier ?? "PREMIUM"

export const isStandardTier = (plan: PlanTier | null | undefined): plan is StandardPlanTier =>
  Boolean(plan && (STANDARD_TIERS as readonly PlanTier[]).includes(plan))

export const isHigherTier = (a: PlanTier, b: PlanTier): boolean => {
  if (!isStandardTier(a) || !isStandardTier(b)) return false
  return STANDARD_TIERS.indexOf(a) > STANDARD_TIERS.indexOf(b)
}

export const packagedUpgradeOptions = (
  current: PlanTier | null,
  options?: { includeCurrent?: boolean }
): StandardPlanTier[] => {
  if (!current || current === "CUSTOM") return [...STANDARD_TIERS]
  const higher = STANDARD_TIERS.filter((tier) => isHigherTier(tier, current))
  if (options?.includeCurrent && isStandardTier(current)) return [current, ...higher]
  return higher
}

export const packagedPlanOptions = (): PlanTier[] => [...TIER_ORDER]

export const isLowerTier = (a: PlanTier, b: PlanTier): boolean => isHigherTier(b, a)

export const upcomingChangeMessage = (
  hostel: Pick<
    HostelSubscription,
    | "upcomingPlan"
    | "upcomingStudentCount"
    | "upcomingBillingCycle"
    | "scheduledChangeDate"
    | "upcomingKind"
    | "plan"
  >
): string | null => {
  if (!hostel.scheduledChangeDate || !hostel.upcomingKind) return null
  const date = formatDate(hostel.scheduledChangeDate)
  const plan = planLabel(hostel.upcomingPlan ?? hostel.plan)
  const students = hostel.upcomingStudentCount
  const cycle = billingCycleLabel(hostel.upcomingBillingCycle)
  if (hostel.upcomingKind === "renewal") {
    return `Renewal scheduled: ${plan} continues from ${date}${students ? ` · ${students} seats` : ""}${hostel.upcomingBillingCycle ? ` · ${cycle}` : ""}.`
  }
  if (hostel.upcomingKind === "students") {
    return `Upcoming seat total: ${students ?? "—"} from ${date}. Current count stays until then.`
  }
  return `Upcoming plan: ${plan}${students ? ` · ${students} seats` : ""} from ${date}. Current plan stays until then.`
}

export const applyDueUpcomingChange = (
  hostel: HostelSubscription,
  pricing?: PricingContext
): HostelSubscription => {
  if (!hostel.scheduledChangeDate || dayjs(hostel.scheduledChangeDate).isAfter(dayjs(), "day")) return hostel
  const start = hostel.scheduledChangeDate
  const cycle = hostel.upcomingBillingCycle ?? hostel.billingCycle
  const plan = hostel.upcomingPlan ?? hostel.plan
  const modules = hostel.upcomingModules ?? hostel.activeModules
  const students = hostel.upcomingStudentCount ?? hostel.studentCount
  const rate = billedRateFor(plan, modules, pricing)
  return {
    ...hostel,
    plan,
    activeModules: modules,
    studentCount: students,
    activatedStudentCount: students,
    addedStudentCount: 0,
    billingCycle: cycle,
    subscriptionStartDate: start,
    renewalDate: billingCycleEndDate(start, cycle),
    status: "active",
    modulesLocked: false,
    trialLapsed: false,
    contractRate: rate,
    upcomingPlan: undefined,
    upcomingModules: undefined,
    upcomingStudentCount: undefined,
    upcomingBillingCycle: undefined,
    scheduledChangeDate: undefined,
    upcomingKind: undefined,
    annualValue: calcARR(students, rate, "active"),
  }
}

type AccessHostel = {
  status: string
  renewalDate: string
  modulesLocked?: boolean
}

export const subscriptionAccessEndDate = (
  hostel: AccessHostel,
  graceDays = DEFAULT_SETTINGS.defaultGraceDays
) => {
  const renewal = dayjs(hostel.renewalDate)
  if (!renewal.isValid() || hostel.status === "trial") return renewal
  return renewal.add(Math.max(0, graceDays), "day")
}

export const isInGracePeriod = (
  hostel: AccessHostel,
  graceDays = DEFAULT_SETTINGS.defaultGraceDays
): boolean => {
  if (hostel.status === "deactivated" || hostel.status === "expired" || hostel.modulesLocked) return false
  if (hostel.status === "trial") return false
  const renewal = dayjs(hostel.renewalDate)
  const accessEnd = subscriptionAccessEndDate(hostel, graceDays)
  if (!renewal.isValid() || !accessEnd.isValid()) return false
  const today = dayjs()
  return !renewal.isAfter(today, "day") && accessEnd.isAfter(today, "day")
}

export const isSubscriptionExpired = (
  hostel: AccessHostel,
  graceDays = DEFAULT_SETTINGS.defaultGraceDays
): boolean => {
  if (hostel.status === "deactivated") return false
  if (hostel.status === "expired" || hostel.modulesLocked) return true
  const end = subscriptionAccessEndDate(hostel, graceDays)
  if (!end.isValid()) return false
  return !end.isAfter(dayjs(), "day")
}

export const effectiveSubscriptionStatus = (
  hostel: {
    status: SubscriptionStatus
    renewalDate: string
    modulesLocked?: boolean
  },
  graceDays = DEFAULT_SETTINGS.defaultGraceDays
): SubscriptionStatus => {
  if (hostel.status === "deactivated") return "deactivated"
  if (isSubscriptionExpired(hostel, graceDays)) return "expired"
  if (hostel.status === "trial") return "active"
  return hostel.status
}

export const isInactiveSubscription = (
  hostel: {
    status: SubscriptionStatus
    renewalDate: string
    modulesLocked?: boolean
  },
  graceDays = DEFAULT_SETTINGS.defaultGraceDays
): boolean => hostel.status === "deactivated" || isSubscriptionExpired(hostel, graceDays)

export const subscriptionLifecycleCaption = (
  hostel: {
    status: SubscriptionStatus
    renewalDate: string
    modulesLocked?: boolean
  },
  graceDays = DEFAULT_SETTINGS.defaultGraceDays
): { label: string; className: string } => {
  if (hostel.status === "deactivated") return { label: "Deactivated", className: "text-slate-600" }
  if (isSubscriptionExpired(hostel, graceDays)) return { label: "Expired", className: "text-red-600" }
  if (isInGracePeriod(hostel, graceDays)) return { label: "Grace", className: "text-amber-600" }
  return { label: "Active", className: "text-green-600" }
}

export const isTrialSubscription = (hostel: {
  status: SubscriptionStatus
  trialLapsed?: boolean
}): boolean => hostel.status === "trial" || Boolean(hostel.trialLapsed)

export const subscriptionPlanLabel = (hostel: {
  plan: PlanTier | null
  status: SubscriptionStatus
  trialLapsed?: boolean
}): string => (isTrialSubscription(hostel) ? "Trial" : planLabel(hostel.plan))

export const lowestTierForModules = (modules: string[]): PlanTier => {
  let tier: PlanTier = "PREMIUM"
  modules.forEach((key) => {
    const required = requiredTierForModule(key)
    if (isHigherTier(required, tier)) tier = required
  })
  return tier
}

export const modulesForPlan = (
  plan: PlanTier | null,
  planModules: Record<PlanTier, string[]>
): string[] => {
  if (!plan) return []
  return planModules[plan] ?? []
}

export type GstRateSplit = { cgstRate?: number; sgstRate?: number }

export const gstRatesFromSettings = (settings: {
  gstRate?: number
  cgstRate?: number
  sgstRate?: number
}) => {
  const fallback = settings.gstRate ?? 18
  const cgstRate = settings.cgstRate ?? fallback / 2
  const sgstRate = settings.sgstRate ?? fallback / 2
  return { cgstRate, sgstRate, gstRate: cgstRate + sgstRate }
}

export const gstBreakdown = (
  subtotal: number,
  sameState: boolean,
  gstRate = 18,
  rates?: GstRateSplit
) => {
  const split = gstRatesFromSettings({ gstRate, cgstRate: rates?.cgstRate, sgstRate: rates?.sgstRate })
  if (sameState) {
    const cgst = Math.round((subtotal * split.cgstRate) / 100)
    const sgst = Math.round((subtotal * split.sgstRate) / 100)
    const gst = cgst + sgst
    return { cgst, sgst, igst: 0, gst, total: subtotal + gst }
  }
  const igst = Math.round((subtotal * split.gstRate) / 100)
  return { cgst: 0, sgst: 0, igst, gst: igst, total: subtotal + igst }
}

export const invoiceGrossAmount = (invoice: { amount: number; grossAmount?: number }): number =>
  invoice.grossAmount ?? invoice.amount

export const discountAmountOff = (
  gross: number,
  type?: InvoiceDiscountType,
  value?: number
): number => {
  if (!type || value == null || value <= 0 || gross <= 0) return 0
  const off = type === "percent" ? Math.round((gross * value) / 100) : Math.round(value)
  return Math.min(Math.max(0, off), Math.max(0, Math.round(gross)))
}

export const invoiceTotalsFromGross = (params: {
  gross: number
  discountType?: InvoiceDiscountType
  discountValue?: number
  sameState: boolean
  gstRate?: number
  cgstRate?: number
  sgstRate?: number
  proRatedAdjustment?: number
}) => {
  const gross = Math.max(0, Math.round(params.gross))
  const discountOff = discountAmountOff(gross, params.discountType, params.discountValue)
  const taxable = Math.max(0, gross - discountOff)
  const gstBase = taxable + (params.proRatedAdjustment ?? 0)
  const gst = gstBreakdown(gstBase, params.sameState, params.gstRate, {
    cgstRate: params.cgstRate,
    sgstRate: params.sgstRate,
  })
  return { gross, discountOff, taxable, gstBase, ...gst }
}

const FY_INVOICE = /^(?:yoco\/inv\/)?(\d{4}-\d{2})\/(\d+)$/

export const financialYearLabel = (date?: string | Date): string => {
  const value = date ? dayjs(date) : dayjs()
  const startYear = value.month() >= 3 ? value.year() : value.year() - 1
  const endShort = String((startYear + 1) % 100).padStart(2, "0")
  return `${startYear}-${endShort}`
}

export const formatInvoiceSerial = (serial: number, date?: string | Date): string => {
  const serialText = String(Math.max(1, serial)).padStart(4, "0")
  return `yoco/inv/${financialYearLabel(date)}/${serialText}`
}

export const invoiceSerialInYear = (invoiceNo: string, fy = financialYearLabel()): number => {
  const match = invoiceNo.match(FY_INVOICE)
  if (!match || match[1] !== fy) return 0
  return Number(match[2]) || 0
}

export const formatRequestNo = (serial: number): string => `UR-${String(Math.max(1, serial)).padStart(4, "0")}`

export const requestSerial = (requestNo?: string): number => {
  const match = requestNo?.match(/^UR-(\d+)$/)
  return match ? Number(match[1]) : 0
}

export const unbilledApprovedRequests = <T extends { id: string; status: string }>(hostel: {
  pendingRequests: T[]
  invoices: { upgradeRequestId?: string }[]
}) => {
  const billed = new Set(hostel.invoices.flatMap((invoice) => (invoice.upgradeRequestId ? [invoice.upgradeRequestId] : [])))
  return hostel.pendingRequests.filter((request) => request.status === "approved" && !billed.has(request.id))
}

export const daysUntil = (date: string): number => dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day")

export const monthsRemainingInCycle = (renewalDate: string, cycle: BillingCycle): number => {
  const remaining = Math.max(0, dayjs(renewalDate).diff(dayjs(), "month", true))
  return Math.min(billingMonths(cycle), Math.ceil(remaining))
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export const isValidGstin = (value: string): boolean => GSTIN_REGEX.test(value.trim().toUpperCase())

export const initials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?"
