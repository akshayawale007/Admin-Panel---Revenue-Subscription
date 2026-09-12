import type { CustomModuleRates, ModuleCatalogItem, PlanRates, PlanTier, RevenueSettings, StandardPlanTier } from "./types"

export const DEFAULT_PLAN_RATES: PlanRates = {
  PREMIUM: 50,
  ADVANCED: 60,
  ELITE: 70,
}

export const PLAN_RATES: Record<PlanTier, number> = {
  ...DEFAULT_PLAN_RATES,
  CUSTOM: 0,
}

export const DEFAULT_CUSTOM_MODULE_RATES: CustomModuleRates = {
  USER: 12.5,
  MESS: 12.5,
  LEAVE: 12.5,
  COMPLAINTS: 12.5,
  ROOM_ALLOCATION: 3.33,
  ANNOUNCEMENT: 3.33,
  NOTICE: 3.34,
  LAUNDRY: 3.33,
  INVENTORY: 3.33,
  VISITOR: 3.34,
}

export const STANDARD_TIERS: StandardPlanTier[] = ["PREMIUM", "ADVANCED", "ELITE"]

export const TIER_ORDER: PlanTier[] = [...STANDARD_TIERS, "CUSTOM"]

/** Shared plan colors: blue premium, green advanced, purple-platinum elite, slate custom. */
export const PLAN_COLORS: Record<
  PlanTier,
  { chipClass: string; bg: string; text: string; dotClass: string }
> = {
  PREMIUM: {
    chipClass: "bg-[#DBEAFE] text-[#1E40AF]",
    bg: "#DBEAFE",
    text: "#1E40AF",
    dotClass: "bg-[#3B82F6]",
  },
  ADVANCED: {
    chipClass: "bg-[#E8F0EA] text-[#3D5C48]",
    bg: "#E8F0EA",
    text: "#3D5C48",
    dotClass: "bg-[#7A9A86]",
  },
  ELITE: {
    chipClass: "bg-[#EDE8F4] text-[#5A4A6E]",
    bg: "#EDE8F4",
    text: "#5A4A6E",
    dotClass: "bg-[#9B8BB4]",
  },
  CUSTOM: {
    chipClass: "bg-[#E8EEF6] text-[#334155]",
    bg: "#E8EEF6",
    text: "#334155",
    dotClass: "bg-[#64748B]",
  },
}

/** Module pills: current plan = purple, not yet included = green. Never use plan orange. */
export const MODULE_PILL_CURRENT = "bg-[#EDE8F4] text-[#5A4A6E]"
export const MODULE_PILL_NEW = "bg-[#DCEFE4] text-[#2F6B45]"
export const MODULE_PILL_CURRENT_BG = "#EDE8F4"
export const MODULE_PILL_CURRENT_TEXT = "#5A4A6E"

/** Mock backend module catalog — plans pick from this dropdown. */
export const MODULE_CATALOG: ModuleCatalogItem[] = [
  { key: "USER", name: "User", description: "Manage residents, staff, and access profiles.", minTier: "PREMIUM" },
  { key: "MESS", name: "Mess", description: "Menus, meal attendance, and mess billing.", minTier: "PREMIUM" },
  { key: "LEAVE", name: "Leave", description: "Student leave requests and approvals.", minTier: "PREMIUM" },
  { key: "COMPLAINTS", name: "Complaints", description: "Track and resolve hostel complaints.", minTier: "PREMIUM" },
  { key: "ROOM_ALLOCATION", name: "Room Allocation", description: "Assign and track beds and rooms.", minTier: "ADVANCED" },
  { key: "ANNOUNCEMENT", name: "Announcement", description: "Broadcast updates to residents.", minTier: "ADVANCED" },
  { key: "NOTICE", name: "Notice", description: "Publish official hostel notices.", minTier: "ADVANCED" },
  { key: "LAUNDRY", name: "Laundry", description: "Log laundry orders and status.", minTier: "ELITE" },
  { key: "INVENTORY", name: "Inventory", description: "Stock counts and hostel supplies.", minTier: "ELITE" },
  { key: "VISITOR", name: "Visitor", description: "Visitor check-in and approvals.", minTier: "ELITE" },
]

export const DEFAULT_PLAN_MODULES: Record<PlanTier, string[]> = {
  PREMIUM: ["USER", "MESS", "LEAVE", "COMPLAINTS"],
  ADVANCED: ["USER", "MESS", "LEAVE", "COMPLAINTS", "ROOM_ALLOCATION", "ANNOUNCEMENT", "NOTICE"],
  ELITE: [
    "USER",
    "MESS",
    "LEAVE",
    "COMPLAINTS",
    "ROOM_ALLOCATION",
    "ANNOUNCEMENT",
    "NOTICE",
    "LAUNDRY",
    "INVENTORY",
    "VISITOR",
  ],
  CUSTOM: [],
}

export const DEFAULT_SETTINGS: RevenueSettings = {
  companyName: "Yoco Stays Pvt Ltd",
  gstin: "27AABCU9603R1ZM",
  companyAddress: "4th Floor, Yoco Hub, Baner, Pune, Maharashtra 411045",
  invoicePrefix: "YS-",
  invoiceSequence: 1042,
  gstRate: 18,
  cgstRate: 9,
  sgstRate: 9,
  defaultGraceDays: 30,
  defaultTrialDays: 30,
  reminderDays: [30, 15, 7],
  whatsappSenderName: "Yoco Billing",
  whatsappSenderPhone: "+91 98765 00000",
}

export const ADMIN_NAME = "Akshay Sharma"
export const INVOICE_ACTOR = "superadmin01"
