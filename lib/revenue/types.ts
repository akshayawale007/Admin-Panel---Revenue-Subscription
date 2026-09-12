export type StandardPlanTier = "PREMIUM" | "ADVANCED" | "ELITE"

export type PlanTier = StandardPlanTier | "CUSTOM"

export type BillingCycle = "QUARTERLY" | "SEMIANNUAL" | "ANNUAL"

export type SubscriptionStatus = "active" | "trial" | "expired" | "deactivated"

export type RequestStatus = "pending" | "on_hold" | "approved" | "rejected"

export type InvoiceStatus = "paid" | "unpaid" | "voided"

export type InvoiceType =
  | "annual_subscription"
  | "mid_cycle_student_upgrade"
  | "mid_cycle_plan_upgrade"
  | "custom_module_addition"
  | "manual"

export type InvoiceDiscountType = "flat" | "percent"

export type RequestedByDesignation = "Warden" | "Caretaker" | "Student" | "Parent"

export type PendingRequestType =
  | "plan_upgrade"
  | "plan_downgrade"
  | "student_count_update"
  | "module_add_remove"
  | "grace_period_extension"
  | "new_subscription"
  | "renewal_after_expiry"

export type WhatsAppMessageType =
  | "renewal_reminder"
  | "plan_approved"
  | "plan_rejected"
  | "on_hold"
  | "invoice_sent"
  | "grace_period_warning"
  | "module_locked"

export type ModuleKey = string

export type ModuleCatalogItem = {
  key: ModuleKey
  name: string
  description: string
  minTier: StandardPlanTier
}

export type PendingRequest = {
  id: string
  type: PendingRequestType
  requestedBy: string
  requestedByDesignation: RequestedByDesignation
  submittedOn: string
  status: RequestStatus
  planRequested?: PlanTier | null
  studentCount?: number
  requestedAddStudents?: number
  modules?: ModuleKey[]
  details?: string
  holdReason?: string
  rejectReason?: string
  scheduledFor?: string
  billingCycle?: BillingCycle
  subscriptionStartDate?: string
  renewalDate?: string
  startTrial?: boolean
  adminHistory?: AdminActionEvent[]
}

export type UpcomingKind = "renewal" | "upgrade" | "downgrade" | "students"

export type AdminActionEvent = {
  id: string
  action: string
  note?: string
  timestamp: string
  by: string
}

export type Invoice = {
  id: string
  invoiceNo: string
  billingPeriodStart: string
  billingPeriodEnd: string
  students: number
  amount: number
  gst: number
  total: number
  status: InvoiceStatus
  dateGenerated: string
  sameState: boolean
  proRatedAdjustment?: number
  dueDate: string
  modules: ModuleKey[]
  plan: PlanTier | null
  rate: number
  invoiceType: InvoiceType
  billingCycle?: BillingCycle
  invoiceBreakdown?: InvoiceBreakdown
  invoiceHistory?: InvoiceHistoryEvent[]
  notes?: string
  grossAmount?: number
  discountType?: InvoiceDiscountType
  discountValue?: number
  discountReason?: string
}

export type RevenueViewerRole = "admin" | "warden"

export type InvoiceHistoryEvent = {
  id: string
  action: string
  note?: string
  timestamp: string
  by: string
}

export type InvoiceBreakdown = {
  originalStudentCount?: number
  addedStudentCount?: number
  billedStudentCount?: number
  previousPlan?: PlanTier | null
  newPlan?: PlanTier | null
  previousRate?: number
  newRate?: number
  monthsRemaining?: number
  periodMonths?: number
  charge?: number
  addedModules?: ModuleKey[]
  addedModuleRates?: Array<{ key: ModuleKey; rate: number }>
}

export type PlanRates = Record<StandardPlanTier, number>

export type CustomModuleRates = Record<ModuleKey, number>

export type PaymentProof = {
  id: string
  fileName: string
  uploadedOn: string
  uploadedBy: string
  forPeriod: string
  previewUrl?: string
}

export type AuditEvent = {
  id: string
  description: string
  timestamp: string
  adminName: string
  icon?: string
}

export type AdminNote = {
  id: string
  adminName: string
  timestamp: string
  text: string
}

export type HostelSubscription = {
  _id: string
  hostelId: string
  hostelCode: string
  name: string
  city: string
  state: string
  adminName: string
  adminPhone: string
  plan: PlanTier | null
  status: SubscriptionStatus
  billingCycle: BillingCycle
  studentCount: number
  activatedStudentCount: number
  addedStudentCount: number
  annualValue: number
  contractRate: number
  subscriptionStartDate: string
  renewalDate: string
  gracePeriodEndDate?: string
  activeModules: ModuleKey[]
  pendingRequests: PendingRequest[]
  invoices: Invoice[]
  paymentProofs: PaymentProof[]
  auditTrail: AuditEvent[]
  notes: AdminNote[]
  proRatedAdjustment?: number
  lastContactedAt?: string
  lastPaymentDate?: string
  trialLapsed?: boolean
  modulesLocked?: boolean
  upcomingPlan?: PlanTier | null
  upcomingModules?: ModuleKey[]
  upcomingStudentCount?: number
  upcomingBillingCycle?: BillingCycle
  scheduledChangeDate?: string
  upcomingKind?: UpcomingKind
}

export type RevenueSettings = {
  companyName: string
  gstin: string
  companyAddress: string
  invoicePrefix: string
  invoiceSequence: number
  gstRate: number
  cgstRate: number
  sgstRate: number
  logoDataUrl?: string
  defaultGraceDays: number
  defaultTrialDays: number
  reminderDays: number[]
  whatsappSenderName: string
  whatsappSenderPhone: string
}

export type PlanModuleConfig = Record<PlanTier, ModuleKey[]>

export type PricingContext = {
  planRates?: PlanRates
  customModuleRates?: CustomModuleRates
  planModules?: PlanModuleConfig
}

export type SubscriptionHostelInput = {
  hostelId: string
  hostelCode: string
  name: string
  city: string
  state: string
  adminName: string
  adminPhone: string
}
