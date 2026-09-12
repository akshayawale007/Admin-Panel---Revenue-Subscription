import { DEFAULT_CUSTOM_MODULE_RATES, DEFAULT_PLAN_MODULES, DEFAULT_PLAN_RATES, STANDARD_TIERS } from "./constants"
import type {
  CustomModuleRates,
  ModuleKey,
  PlanModuleConfig,
  PlanRates,
  PlanTier,
  PricingContext,
  StandardPlanTier,
} from "./types"

export const roundRate = (value: number): number => Math.round(value * 100) / 100

export const formatRate = (amount: number): string =>
  `₹${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)}`

export function resolvePlanRates(planRates?: PlanRates): PlanRates {
  return { ...DEFAULT_PLAN_RATES, ...planRates }
}

export function resolveCustomModuleRates(rates?: CustomModuleRates): CustomModuleRates {
  return { ...DEFAULT_CUSTOM_MODULE_RATES, ...rates }
}

export function resolvePlanModules(planModules?: PlanModuleConfig): PlanModuleConfig {
  return planModules ?? DEFAULT_PLAN_MODULES
}

export function resolvePricing(pricing?: PricingContext): {
  planRates: PlanRates
  customModuleRates: CustomModuleRates
  planModules: PlanModuleConfig
} {
  return {
    planRates: resolvePlanRates(pricing?.planRates),
    customModuleRates: resolveCustomModuleRates(pricing?.customModuleRates),
    planModules: resolvePlanModules(pricing?.planModules),
  }
}

export function highestCompletePackagedPlan(
  modules: string[],
  planModules: PlanModuleConfig = DEFAULT_PLAN_MODULES
): StandardPlanTier | null {
  const selected = new Set(modules)
  for (let i = STANDARD_TIERS.length - 1; i >= 0; i -= 1) {
    const tier = STANDARD_TIERS[i]
    const required = planModules[tier] ?? []
    if (required.length > 0 && required.every((key) => selected.has(key))) return tier
  }
  return null
}

export type CustomPlanBreakdown = {
  basePlan: StandardPlanTier | null
  baseRate: number
  extras: Array<{ key: ModuleKey; rate: number }>
  monthlyRate: number
}

export function customPlanRateBreakdown(modules: string[], pricing?: PricingContext): CustomPlanBreakdown {
  const { planRates, customModuleRates, planModules } = resolvePricing(pricing)
  const base = highestCompletePackagedPlan(modules, planModules)
  if (base) {
    const packaged = new Set(planModules[base] ?? [])
    const extras = modules
      .filter((key) => !packaged.has(key))
      .map((key) => ({ key, rate: customModuleRates[key] ?? 0 }))
    const extraSum = extras.reduce((sum, line) => sum + line.rate, 0)
    return {
      basePlan: base,
      baseRate: planRates[base],
      extras,
      monthlyRate: roundRate(planRates[base] + extraSum),
    }
  }
  const extras = modules.map((key) => ({ key, rate: customModuleRates[key] ?? 0 }))
  return {
    basePlan: null,
    baseRate: 0,
    extras,
    monthlyRate: roundRate(extras.reduce((sum, line) => sum + line.rate, 0)),
  }
}

export function customPlanMonthlyRate(modules: string[], pricing?: PricingContext): number {
  return customPlanRateBreakdown(modules, pricing).monthlyRate
}

export const rateForPlan = (plan: PlanTier | null, planRates?: PlanRates): number => {
  if (!plan || plan === "CUSTOM") return 0
  return resolvePlanRates(planRates)[plan]
}

export const billedRateFor = (
  plan: PlanTier | null,
  modules: string[] = [],
  pricing?: PricingContext
): number => {
  if (!plan) return 0
  if (plan === "CUSTOM") return customPlanMonthlyRate(modules, pricing)
  return rateForPlan(plan, pricing?.planRates)
}

export const catalogRate = billedRateFor

export const hostelRate = (hostel: { contractRate?: number; status?: string }): number => {
  if (hostel.status === "trial") return 0
  return hostel.contractRate ?? 0
}

export function addedModulesRate(keys: string[], pricing?: PricingContext): number {
  const { customModuleRates } = resolvePricing(pricing)
  return roundRate(keys.reduce((sum, key) => sum + (customModuleRates[key] ?? 0), 0))
}
