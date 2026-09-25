"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import dayjs from "dayjs"
import { toast } from "react-toastify"
import { INVOICE_ACTOR, ADMIN_NAME, DEFAULT_CUSTOM_MODULE_RATES, DEFAULT_PLAN_MODULES, DEFAULT_PLAN_RATES, DEFAULT_SETTINGS, MODULE_CATALOG } from "@/lib/revenue/constants"
import { INITIAL_HOSTELS } from "@/lib/revenue/mockData"
import type {
  AdminActionEvent,
  AdminNote,
  AuditEvent,
  CustomModuleRates,
  HostelSubscription,
  Invoice,
  InvoiceDiscountType,
  BillingCycle,
  PendingRequest,
  PlanModuleConfig,
  PlanRates,
  PlanTier,
  RevenueSettings,
  SubscriptionHostelInput,
  SubscriptionStatus,
  UpcomingKind,
} from "@/lib/revenue/types"
import { computeMidCycleChange, type SubscriptionChangeInput } from "@/lib/revenue/subscriptionBilling"
import {
  applyDueUpcomingChange,
  billedRateFor,
  billingCycleEndDate,
  calcARR,
  calcPeriodValue,
  gstBreakdown,
  hostelRate,
  isInGracePeriod,
  isLowerTier,
  isSubscriptionExpired,
  matchBillingCycle,
  periodMonthsFromDates,
  defaultInvoiceDueDate,
  financialYearLabel,
  formatInvoiceSerial,
  formatRequestNo,
  invoiceGrossAmount,
  invoiceSerialInYear,
  invoiceTotalsFromGross,
  requestSerial,
  subscriptionAccessEndDate,
} from "@/lib/revenue/utils"
import { remainingFraction } from "@/lib/revenue/subscriptionBilling"

export type SubscriptionUpsertInput = {
  hostel: SubscriptionHostelInput
  plan: PlanTier
  studentCount: number
  modules: string[]
  startDate: string
  renewalDate: string
  trial: boolean
  trialDays?: number
  billingCycle?: BillingCycle
}

export type ManualInvoiceInput = {
  notes: string
  billingPeriodStart: string
  billingPeriodEnd: string
  students: number
  plan: PlanTier | null
  rate: number
  modules: string[]
  billingCycle?: BillingCycle
  grossAmount: number
  dueDate: string
  status?: "paid" | "unpaid"
  discountType?: InvoiceDiscountType
  discountValue?: number
  discountReason?: string
}

export type InvoiceDiscountInput =
  | { type: "none" }
  | { type: InvoiceDiscountType; value: number; reason?: string }

const toastOpts = { autoClose: 3000 } as const

type RevenueContextValue = {
  hostels: HostelSubscription[]
  settings: RevenueSettings
  planModules: PlanModuleConfig
  planRates: PlanRates
  customModuleRates: CustomModuleRates
  getHostel: (id: string) => HostelSubscription | undefined
  updateHostel: (id: string, patch: Partial<HostelSubscription> | ((h: HostelSubscription) => HostelSubscription)) => void
  addAudit: (id: string, description: string, adminName?: string) => void
  approveRequest: (
    hostelId: string,
    requestId: string,
    note?: string,
    options?: { createInvoice?: boolean }
  ) => void
  rejectRequest: (hostelId: string, requestId: string, reason: string) => void
  holdRequest: (hostelId: string, requestId: string) => void
  addPendingRequest: (
    hostelId: string,
    input: Pick<PendingRequest, "type"> &
      Partial<
        Pick<
          PendingRequest,
          | "planRequested"
          | "studentCount"
          | "requestedAddStudents"
          | "modules"
          | "details"
          | "billingCycle"
          | "startTrial"
          | "subscriptionStartDate"
          | "renewalDate"
          | "trialDays"
        >
      >
  ) => void
  withdrawPendingRequest: (hostelId: string, requestId: string) => void
  saveSettings: (next: RevenueSettings) => void
  savePlanModules: (next: PlanModuleConfig) => void
  savePricing: (next: { planRates: PlanRates; customModuleRates: CustomModuleRates }) => void
  upsertSubscription: (input: SubscriptionUpsertInput) => void
  updateSubscription: (hostelId: string, input: SubscriptionChangeInput) => void
  nextInvoiceNo: () => string
  createManualInvoice: (hostelId: string, input: ManualInvoiceInput) => void
  updateManualInvoice: (hostelId: string, invoiceId: string, input: ManualInvoiceInput) => void
  createLinkedInvoice: (
    hostelId: string,
    draft: Omit<Invoice, "id" | "invoiceNo" | "upgradeRequestId" | "upgradeRequestNo" | "sameState">,
    request: Pick<PendingRequest, "type"> &
      Partial<
        Pick<
          PendingRequest,
          "planRequested" | "studentCount" | "modules" | "billingCycle" | "subscriptionStartDate" | "renewalDate" | "details"
        >
      >
  ) => void
  applyInvoiceDiscount: (hostelId: string, invoiceId: string, discount: InvoiceDiscountInput) => void
}

const RevenueContext = createContext<RevenueContextValue | null>(null)

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function RevenueProvider({ children }: { children: ReactNode }) {
  const [hostels, setHostels] = useState<HostelSubscription[]>(INITIAL_HOSTELS)
  const [settings, setSettings] = useState<RevenueSettings>(DEFAULT_SETTINGS)
  const [planModules, setPlanModules] = useState<PlanModuleConfig>(DEFAULT_PLAN_MODULES)
  const [planRates, setPlanRates] = useState<PlanRates>(DEFAULT_PLAN_RATES)
  const [customModuleRates, setCustomModuleRates] = useState<CustomModuleRates>(DEFAULT_CUSTOM_MODULE_RATES)
  const invoiceCursor = useRef<{ fy: string; next: number } | null>(null)
  const requestCursor = useRef(0)

  const pricing = useMemo(
    () => ({ planRates, customModuleRates, planModules }),
    [planRates, customModuleRates, planModules]
  )

  useEffect(() => {
    setHostels((prev) => {
      let changed = false
      const next = prev.map((h) => {
        const applied = applyDueUpcomingChange(h, pricing)
        if (applied !== h) changed = true
        return applied
      })
      return changed ? next : prev
    })
  }, [hostels, pricing])

  const getHostel = useCallback(
    (id: string) => hostels.find((h) => h.hostelId === id || h._id === id || h.hostelCode === id),
    [hostels]
  )

  const updateHostel = useCallback(
    (
      id: string,
      patch: Partial<HostelSubscription> | ((h: HostelSubscription) => HostelSubscription)
    ) => {
      setHostels((prev) =>
        prev.map((h) => {
          if (h.hostelId !== id && h._id !== id) return h
          const next = typeof patch === "function" ? patch(h) : { ...h, ...patch }
          const rate = hostelRate(next)
          return { ...next, annualValue: calcARR(next.studentCount, rate, next.status) }
        })
      )
    },
    []
  )

  const addAudit = useCallback((id: string, description: string, adminName = ADMIN_NAME) => {
    const event: AuditEvent = {
      id: uid("aud"),
      description,
      timestamp: dayjs().toISOString(),
      adminName,
    }
    setHostels((prev) =>
      prev.map((h) =>
        h.hostelId === id || h._id === id
          ? { ...h, auditTrail: [event, ...h.auditTrail] }
          : h
      )
    )
  }, [])

  const ensureCursors = useCallback(() => {
    const fy = financialYearLabel()
    let maxInv = 0
    let maxReq = 0
    for (const hostel of hostels) {
      for (const invoice of hostel.invoices) maxInv = Math.max(maxInv, invoiceSerialInYear(invoice.invoiceNo, fy))
      for (const request of hostel.pendingRequests) maxReq = Math.max(maxReq, requestSerial(request.requestNo))
    }
    if (!invoiceCursor.current || invoiceCursor.current.fy !== fy) {
      invoiceCursor.current = { fy, next: maxInv + 1 }
    } else if (invoiceCursor.current.next < maxInv + 1) {
      invoiceCursor.current.next = maxInv + 1
    }
    if (requestCursor.current < maxReq) requestCursor.current = maxReq
  }, [hostels])

  const takeInvoiceNos = useCallback(
    (count: number) => {
      ensureCursors()
      if (count <= 0) return [] as string[]
      const cursor = invoiceCursor.current
      if (!cursor) return []
      const start = cursor.next
      cursor.next += count
      return Array.from({ length: count }, (_, i) => formatInvoiceSerial(start + i))
    },
    [ensureCursors]
  )

  const takeRequestNo = useCallback(() => {
    ensureCursors()
    requestCursor.current += 1
    return formatRequestNo(requestCursor.current)
  }, [ensureCursors])

  const nextInvoiceNo = useCallback(() => takeInvoiceNos(1)[0], [takeInvoiceNos])

  const createManualInvoice = useCallback(
    (hostelId: string, input: ManualInvoiceInput) => {
      const hostel = hostels.find((h) => h.hostelId === hostelId || h._id === hostelId)
      if (!hostel) return
      const hasDiscount = Boolean(input.discountType && input.discountValue && input.discountValue > 0)
      const totals = invoiceTotalsFromGross({
        gross: input.grossAmount,
        discountType: hasDiscount ? input.discountType : undefined,
        discountValue: hasDiscount ? input.discountValue : undefined,
        sameState: true,
        gstRate: settings.gstRate,
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
      })
      const generatedOn = dayjs().format("YYYY-MM-DD")
      const invoiceNo = nextInvoiceNo()
      const note = input.notes.trim()
      const historyNote = hasDiscount
        ? `${note} · Discount ${input.discountType === "percent" ? `${input.discountValue}%` : `₹${input.discountValue}`}${input.discountReason ? ` — ${input.discountReason}` : ""}`
        : note
      const invoice: Invoice = {
        id: uid("inv"),
        invoiceNo,
        billingPeriodStart: input.billingPeriodStart,
        billingPeriodEnd: input.billingPeriodEnd,
        students: input.students,
        amount: totals.taxable,
        gst: totals.gst,
        total: totals.total,
        status: "unpaid",
        dateGenerated: generatedOn,
        sameState: true,
        dueDate: input.dueDate || defaultInvoiceDueDate(generatedOn),
        modules: input.modules,
        plan: input.plan,
        rate: input.rate,
        invoiceType: "manual",
        billingCycle: input.billingCycle,
        notes: note,
        grossAmount: hasDiscount ? totals.gross : undefined,
        discountType: hasDiscount ? input.discountType : undefined,
        discountValue: hasDiscount ? input.discountValue : undefined,
        discountReason: hasDiscount ? input.discountReason?.trim() || undefined : undefined,
        invoiceHistory: [
          {
            id: uid("ih"),
            action: "manual invoice created",
            note: historyNote,
            timestamp: new Date().toISOString(),
            by: INVOICE_ACTOR,
          },
        ],
      }
      updateHostel(hostelId, (h) => ({ ...h, invoices: [invoice, ...h.invoices] }))
      addAudit(hostelId, `Invoice ${invoiceNo} created (manual)`, INVOICE_ACTOR)
      toast.success("Manual invoice created", toastOpts)
    },
    [addAudit, hostels, nextInvoiceNo, settings.cgstRate, settings.gstRate, settings.sgstRate, updateHostel]
  )

  const updateManualInvoice = useCallback(
    (hostelId: string, invoiceId: string, input: ManualInvoiceInput) => {
      const hostel = hostels.find((h) => h.hostelId === hostelId || h._id === hostelId)
      const current = hostel?.invoices.find((invoice) => invoice.id === invoiceId)
      if (!hostel || !current || current.status !== "unpaid") {
        toast.error("Only unpaid invoices can be edited", toastOpts)
        return
      }
      const gross = invoiceGrossAmount(current)
      const hasDiscount = Boolean(input.discountType && input.discountValue && input.discountValue > 0)
      const totals = invoiceTotalsFromGross({
        gross,
        discountType: hasDiscount ? input.discountType : undefined,
        discountValue: hasDiscount ? input.discountValue : undefined,
        sameState: true,
        gstRate: settings.gstRate,
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
        proRatedAdjustment: current.proRatedAdjustment,
      })
      const reason = hasDiscount ? input.discountReason?.trim() || undefined : undefined
      const historyEvent = {
        id: uid("ih"),
        action: hasDiscount ? "discount updated" : "discount cleared",
        note: hasDiscount
          ? `${input.discountType === "percent" ? `${input.discountValue}%` : `₹${input.discountValue}`}${reason ? ` — ${reason}` : ""}`
          : undefined,
        timestamp: new Date().toISOString(),
        by: INVOICE_ACTOR,
      }
      updateHostel(hostelId, (h) => ({
        ...h,
        invoices: h.invoices.map((invoice) =>
          invoice.id === invoiceId
            ? {
                ...invoice,
                amount: totals.taxable,
                gst: totals.gst,
                total: totals.total,
                grossAmount: hasDiscount ? totals.gross : undefined,
                discountType: hasDiscount ? input.discountType : undefined,
                discountValue: hasDiscount ? input.discountValue : undefined,
                discountReason: reason,
                invoiceHistory: [historyEvent, ...(invoice.invoiceHistory ?? [])],
              }
            : invoice
        ),
      }))
      addAudit(hostelId, `Invoice ${current.invoiceNo} edited`, INVOICE_ACTOR)
      toast.success("Invoice updated", toastOpts)
    },
    [addAudit, hostels, settings.cgstRate, settings.gstRate, settings.sgstRate, updateHostel]
  )

  const applyInvoiceDiscount = useCallback(
    (hostelId: string, invoiceId: string, discount: InvoiceDiscountInput) => {
      const hostel = hostels.find((h) => h.hostelId === hostelId || h._id === hostelId)
      if (!hostel) return
      const current = hostel.invoices.find((i) => i.id === invoiceId)
      if (!current || current.status !== "unpaid") return
      const gross = invoiceGrossAmount(current)
      const cleared = discount.type === "none"
      const totals = invoiceTotalsFromGross({
        gross,
        discountType: cleared ? undefined : discount.type,
        discountValue: cleared ? undefined : discount.value,
        sameState: true,
        gstRate: settings.gstRate,
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
        proRatedAdjustment: current.proRatedAdjustment,
      })
      const reason = cleared ? undefined : discount.reason?.trim() || undefined
      const actionLabel = cleared ? "discount cleared" : "discount applied"
      const note = cleared
        ? undefined
        : `${discount.type === "percent" ? `${discount.value}%` : `₹${discount.value}`}${reason ? ` — ${reason}` : ""}`
      const historyEvent = {
        id: uid("ih"),
        action: actionLabel,
        note,
        timestamp: new Date().toISOString(),
        by: INVOICE_ACTOR,
      }
      updateHostel(hostelId, (h) => ({
        ...h,
        invoices: h.invoices.map((i) =>
          i.id === invoiceId
            ? {
                ...i,
                grossAmount: cleared ? undefined : gross,
                discountType: cleared ? undefined : discount.type,
                discountValue: cleared ? undefined : discount.value,
                discountReason: reason,
                sameState: true,
                amount: totals.taxable,
                gst: totals.gst,
                total: totals.total,
                invoiceHistory: [historyEvent, ...(i.invoiceHistory ?? [])],
              }
            : i
        ),
      }))
      addAudit(
        hostelId,
        note ? `Invoice ${current.invoiceNo} ${actionLabel} — ${note}` : `Invoice ${current.invoiceNo} ${actionLabel}`,
        INVOICE_ACTOR
      )
      toast.success(cleared ? "Discount removed" : "Discount applied", toastOpts)
    },
    [addAudit, hostels, settings.cgstRate, settings.gstRate, settings.sgstRate, updateHostel]
  )

  const materializeChange = useCallback(
    (
      h: HostelSubscription,
      input: SubscriptionChangeInput,
      options?: { createInvoice?: boolean; upgradeRequestId?: string; upgradeRequestNo?: string }
    ): HostelSubscription => {
      const result = computeMidCycleChange(h, input, settings.gstRate, {
        pricing,
        isTrial: h.status === "trial",
        inGrace: isInGracePeriod(h, settings.defaultGraceDays),
        accessEndDate: subscriptionAccessEndDate(h, settings.defaultGraceDays).format("YYYY-MM-DD"),
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
      })
      const shouldInvoice = options?.createInvoice !== false
      const nos = shouldInvoice ? takeInvoiceNos(result.invoices.length) : []
      const invoices: Invoice[] = shouldInvoice
        ? result.invoices.map((draft, i) => ({
            ...draft,
            id: uid("inv"),
            invoiceNo: nos[i],
            sameState: true,
            upgradeRequestId: options?.upgradeRequestId,
            upgradeRequestNo: options?.upgradeRequestNo,
          }))
        : []
      const audits: AuditEvent[] = result.descriptions.map((description) => ({
        id: uid("aud"),
        description,
        timestamp: dayjs().toISOString(),
        adminName: ADMIN_NAME,
      }))
      const next: HostelSubscription = {
        ...h,
        plan: result.plan,
        studentCount: result.studentCount,
        activatedStudentCount: result.activatedStudentCount,
        addedStudentCount: result.addedStudentCount,
        activeModules: result.modules,
        contractRate: result.contractRate,
        invoices: [...invoices, ...h.invoices],
        auditTrail: [...audits, ...h.auditTrail],
      }
      next.annualValue = calcARR(next.studentCount, result.contractRate, next.status)
      return next
    },
    [pricing, settings.cgstRate, settings.defaultGraceDays, settings.gstRate, settings.sgstRate, takeInvoiceNos]
  )

  const updateSubscription = useCallback(
    (hostelId: string, input: SubscriptionChangeInput) => {
      const current = hostels.find((h) => h.hostelId === hostelId || h._id === hostelId)
      if (!current) return
      const next = materializeChange(current, input)
      setHostels((prev) => prev.map((h) => (h.hostelId === hostelId || h._id === hostelId ? next : h)))
      toast.success("Subscription updated", toastOpts)
    },
    [hostels, materializeChange]
  )

  const approveRequest = useCallback(
    (hostelId: string, requestId: string, note?: string, options?: { createInvoice?: boolean }) => {
      const createInvoice = options?.createInvoice === true
      const found = hostels.find((h) => h.hostelId === hostelId || h._id === hostelId)
      if (!found) return
      const current = applyDueUpcomingChange(found)
      const request = current.pendingRequests.find((r) => r.id === requestId)
      if (!request) return

      const history: AdminActionEvent = {
        id: uid("ah"),
        action: "Approved",
        note: note?.trim() || undefined,
        timestamp: dayjs().toISOString(),
        by: ADMIN_NAME,
      }
      const approvedAudit: AuditEvent = {
        id: uid("aud"),
        description: note?.trim()
          ? `Approved ${request.type.replace(/_/g, " ")} — ${note.trim()}`
          : `Approved ${request.type.replace(/_/g, " ")}`,
        timestamp: dayjs().toISOString(),
        adminName: ADMIN_NAME,
      }

      const markApproved = (scheduledFor?: string): PendingRequest[] =>
        current.pendingRequests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: "approved" as const,
                scheduledFor,
                adminHistory: [history, ...(r.adminHistory ?? [])],
              }
            : r
        )

      const graceDays = settings.defaultGraceDays
      const inPeriod =
        current.status === "active" &&
        remainingFraction(current.renewalDate, current.billingCycle, {
          periodStart: current.subscriptionStartDate,
        }).inOriginalPeriod
      const immediate =
        Boolean(request.startTrial) ||
        current.status === "trial" ||
        current.status === "deactivated" ||
        isInGracePeriod(current, graceDays) ||
        isSubscriptionExpired(current, graceDays)

      const newPeriodRequested = Boolean(request.subscriptionStartDate && request.renewalDate)
      const stayOnWindow =
        !newPeriodRequested &&
        (inPeriod || current.status === "trial" || isInGracePeriod(current, graceDays))
      const requestedPlan =
        request.type === "module_add_remove" ? "CUSTOM" : (request.planRequested ?? current.plan)
      const requestedModules =
        requestedPlan === "CUSTOM" || request.type === "module_add_remove"
          ? stayOnWindow
            ? Array.from(new Set([...current.activeModules, ...(request.modules ?? [])]))
            : (request.modules ?? current.activeModules)
          : requestedPlan
            ? (planModules[requestedPlan] ?? current.activeModules)
            : current.activeModules
      const requestedStudents = request.studentCount ?? current.studentCount
      const blockDecrease =
        requestedStudents < current.studentCount &&
        (inPeriod || current.status === "trial" || isInGracePeriod(current, graceDays))
      const studentCount = blockDecrease ? current.studentCount : requestedStudents
      const cycle: BillingCycle =
        request.billingCycle ??
        (request.subscriptionStartDate && request.renewalDate
          ? matchBillingCycle(request.subscriptionStartDate, request.renewalDate) || current.billingCycle || "ANNUAL"
          : (current.billingCycle ?? "ANNUAL"))

      const buildInvoice = (
        start: string,
        end: string,
        plan: PlanTier | null,
        modules: string[],
        students: number,
        trialInvoice: boolean
      ): Invoice => {
        const rate = trialInvoice ? 0 : billedRateFor(plan, modules, pricing)
        const amount = trialInvoice
          ? 0
          : calcPeriodValue(students, rate, periodMonthsFromDates(start, end), "active")
        const gst = gstBreakdown(amount, true, settings.gstRate, settings)
        const [invoiceNo] = takeInvoiceNos(1)
        const dateGenerated = dayjs().format("YYYY-MM-DD")
        return {
          id: uid("inv"),
          invoiceNo,
          billingPeriodStart: start,
          billingPeriodEnd: end,
          students,
          amount,
          gst: gst.gst,
          total: gst.total,
          status: trialInvoice ? "paid" : "unpaid",
          dateGenerated,
          sameState: true,
          dueDate: defaultInvoiceDueDate(dateGenerated),
          modules,
          plan,
          rate,
          invoiceType: "annual_subscription" as const,
          billingCycle: cycle,
          upgradeRequestId: request.id,
          upgradeRequestNo: request.requestNo,
        }
      }

      const billedInvoices = (invoice: Invoice | null) =>
        createInvoice && invoice ? [invoice, ...next.invoices] : next.invoices

      let next: HostelSubscription = {
        ...current,
        pendingRequests: markApproved(),
        auditTrail: [approvedAudit, ...current.auditTrail],
      }

      if (request.startTrial) {
        const start = dayjs().format("YYYY-MM-DD")
        const trialDays = Math.max(1, request.trialDays || 30)
        const renewalDate = dayjs(start).add(trialDays, "day").format("YYYY-MM-DD")
        const invoice = createInvoice
          ? buildInvoice(start, renewalDate, requestedPlan, requestedModules, studentCount, true)
          : null
        next = {
          ...next,
          plan: requestedPlan,
          status: "trial",
          studentCount,
          activatedStudentCount: studentCount,
          addedStudentCount: 0,
          subscriptionStartDate: start,
          renewalDate,
          activeModules: requestedModules,
          modulesLocked: false,
          trialLapsed: false,
          contractRate: 0,
          invoices: billedInvoices(invoice),
        }
      } else if (request.type === "student_count_update") {
        const delta = studentCount - current.studentCount
        if (delta < 0 && (inPeriod || current.status === "trial" || isInGracePeriod(current, graceDays))) {
          next.pendingRequests = markApproved()
        } else if (delta > 0 && inPeriod) {
          next = materializeChange(
            next,
            {
              plan: current.plan,
              addStudents: delta,
              modules: current.activeModules,
            },
            { createInvoice, upgradeRequestId: request.id, upgradeRequestNo: request.requestNo }
          )
          next.pendingRequests = markApproved()
        } else if (delta !== 0 && inPeriod) {
          next = {
            ...next,
            pendingRequests: markApproved(current.renewalDate),
            upcomingStudentCount: studentCount,
            upcomingPlan: current.plan,
            upcomingModules: current.activeModules,
            upcomingBillingCycle: current.billingCycle,
            scheduledChangeDate: current.renewalDate,
            upcomingKind: "students",
          }
        } else if (immediate) {
          const start = dayjs().format("YYYY-MM-DD")
          const renewalDate = billingCycleEndDate(start, cycle)
          const invoice = createInvoice
            ? buildInvoice(start, renewalDate, requestedPlan, requestedModules, studentCount, false)
            : null
          next = {
            ...next,
            plan: requestedPlan,
            status: "active",
            billingCycle: cycle,
            studentCount,
            activatedStudentCount: studentCount,
            addedStudentCount: 0,
            subscriptionStartDate: start,
            renewalDate,
            activeModules: requestedModules,
            modulesLocked: false,
            trialLapsed: false,
            contractRate: invoice?.rate ?? billedRateFor(requestedPlan, requestedModules, pricing),
            invoices: billedInvoices(invoice),
          }
        }
      } else if (
        (request.type === "plan_upgrade" || request.type === "module_add_remove") &&
        (inPeriod ||
          ((current.status === "trial" || isInGracePeriod(current, graceDays)) && !newPeriodRequested))
      ) {
        const addStudents = Math.max(0, studentCount - current.studentCount)
        next = materializeChange(
          next,
          {
            plan: requestedPlan,
            addStudents,
            modules: requestedModules,
          },
          { createInvoice, upgradeRequestId: request.id, upgradeRequestNo: request.requestNo }
        )
        next.pendingRequests = markApproved()
      } else if (immediate) {
        const start = request.subscriptionStartDate || dayjs().format("YYYY-MM-DD")
        const renewalDate = request.renewalDate || billingCycleEndDate(start, cycle)
        const invoice = createInvoice
          ? buildInvoice(start, renewalDate, requestedPlan, requestedModules, studentCount, false)
          : null
        next = {
          ...next,
          plan: requestedPlan,
          status: "active",
          billingCycle: cycle,
          studentCount,
          activatedStudentCount: studentCount,
          addedStudentCount: 0,
          subscriptionStartDate: start,
          renewalDate,
          activeModules: requestedModules,
          modulesLocked: false,
          trialLapsed: false,
          contractRate: invoice?.rate ?? billedRateFor(requestedPlan, requestedModules, pricing),
          invoices: billedInvoices(invoice),
        }
      } else {
        const start = current.renewalDate
        const end = billingCycleEndDate(start, cycle)
        const invoice = createInvoice
          ? buildInvoice(start, end, requestedPlan, requestedModules, studentCount, false)
          : null
        const kind: UpcomingKind =
          request.type === "plan_downgrade" ||
          (requestedPlan && current.plan && isLowerTier(requestedPlan, current.plan))
            ? "downgrade"
            : requestedPlan === current.plan
              ? "renewal"
              : "upgrade"
        next = {
          ...next,
          pendingRequests: markApproved(current.renewalDate),
          upcomingPlan: requestedPlan,
          upcomingModules: requestedModules,
          upcomingStudentCount: studentCount,
          upcomingBillingCycle: cycle,
          scheduledChangeDate: current.renewalDate,
          upcomingKind: kind,
          invoices: billedInvoices(invoice),
        }
      }

      next.annualValue = calcARR(next.studentCount, hostelRate(next), next.status)
      setHostels((prev) => prev.map((h) => (h.hostelId === hostelId || h._id === hostelId ? next : h)))
      toast.success(createInvoice ? "Request approved and invoice created" : "Request approved", toastOpts)
    },
    [hostels, materializeChange, planModules, pricing, settings.defaultGraceDays, settings.gstRate, takeInvoiceNos]
  )

  const rejectRequest = useCallback((hostelId: string, requestId: string, reason: string) => {
    const history: AdminActionEvent = {
      id: uid("ah"),
      action: "Rejected",
      note: reason.trim(),
      timestamp: dayjs().toISOString(),
      by: ADMIN_NAME,
    }
    setHostels((prev) =>
      prev.map((h) => {
        if (h.hostelId !== hostelId && h._id !== hostelId) return h
        const audit: AuditEvent = {
          id: uid("aud"),
          description: `Rejected request — ${reason}`,
          timestamp: dayjs().toISOString(),
          adminName: ADMIN_NAME,
        }
        return {
          ...h,
          pendingRequests: h.pendingRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "rejected" as const,
                  rejectReason: reason,
                  adminHistory: [history, ...(r.adminHistory ?? [])],
                }
              : r
          ),
          auditTrail: [audit, ...h.auditTrail],
        }
      })
    )
    toast.success("Request rejected", toastOpts)
  }, [])

  const addPendingRequest = useCallback(
    (
      hostelId: string,
      input: Pick<PendingRequest, "type"> &
        Partial<
          Pick<
            PendingRequest,
            | "planRequested"
            | "studentCount"
            | "requestedAddStudents"
            | "modules"
            | "details"
            | "billingCycle"
            | "subscriptionStartDate"
            | "renewalDate"
            | "startTrial"
            | "trialDays"
          >
        >
    ) => {
      const current = hostels.find((h) => h.hostelId === hostelId || h._id === hostelId)
      if (!current) return
      const request: PendingRequest = {
        id: uid("pr"),
        requestNo: takeRequestNo(),
        type: input.type,
        requestedBy: current.adminName,
        requestedByDesignation: "Warden",
        submittedOn: dayjs().format("YYYY-MM-DD"),
        status: "pending",
        planRequested: input.planRequested,
        studentCount: input.studentCount,
        requestedAddStudents: input.requestedAddStudents,
        modules: input.modules,
        details: input.details,
        billingCycle: input.billingCycle,
        subscriptionStartDate: input.subscriptionStartDate,
        renewalDate: input.renewalDate,
        startTrial: input.startTrial,
        trialDays: input.startTrial ? Math.max(1, input.trialDays || 30) : undefined,
      }
      setHostels((prev) =>
        prev.map((h) =>
          h.hostelId === hostelId || h._id === hostelId
            ? { ...h, pendingRequests: [request, ...h.pendingRequests] }
            : h
        )
      )
      toast.success("Request submitted", toastOpts)
    },
    [hostels, takeRequestNo]
  )

  const withdrawPendingRequest = useCallback((hostelId: string, requestId: string) => {
    setHostels((prev) =>
      prev.map((h) => {
        if (h.hostelId !== hostelId && h._id !== hostelId) return h
        const request = h.pendingRequests.find((r) => r.id === requestId)
        if (!request || request.status !== "pending") return h
        return {
          ...h,
          pendingRequests: h.pendingRequests.filter((r) => r.id !== requestId),
        }
      })
    )
    toast.success("Request withdrawn", toastOpts)
  }, [])

  const holdRequest = useCallback((hostelId: string, requestId: string) => {
    setHostels((prev) =>
      prev.map((h) => {
        if (h.hostelId !== hostelId && h._id !== hostelId) return h
        const audit: AuditEvent = {
          id: uid("aud"),
          description: "Request put on hold",
          timestamp: dayjs().toISOString(),
          adminName: ADMIN_NAME,
        }
        return {
          ...h,
          pendingRequests: h.pendingRequests.map((r) =>
            r.id === requestId ? { ...r, status: "on_hold" as const } : r
          ),
          auditTrail: [audit, ...h.auditTrail],
        }
      })
    )
    toast.success("Request put on hold", toastOpts)
  }, [])

  const saveSettings = useCallback((next: RevenueSettings) => {
    setSettings(next)
    toast.success("Settings saved", toastOpts)
  }, [])

  const savePlanModules = useCallback((next: PlanModuleConfig) => {
    setPlanModules(next)
  }, [])

  const savePricing = useCallback((next: { planRates: PlanRates; customModuleRates: CustomModuleRates }) => {
    setPlanRates(next.planRates)
    setCustomModuleRates(next.customModuleRates)
  }, [])

  const upsertSubscription = useCallback(
    (input: SubscriptionUpsertInput) => {
      const modules = input.modules.length ? input.modules : input.trial ? MODULE_CATALOG.map((m) => m.key) : input.modules
      const renewalDate = input.renewalDate
      const billingCycle: BillingCycle = input.trial
        ? "ANNUAL"
        : input.billingCycle ?? (matchBillingCycle(input.startDate, renewalDate) || "ANNUAL")
      const rate = input.trial ? 0 : billedRateFor(input.plan, modules, pricing)
      const amount = input.trial
        ? 0
        : calcPeriodValue(input.studentCount, rate, periodMonthsFromDates(input.startDate, renewalDate), "active")
      const totals = invoiceTotalsFromGross({
        gross: amount,
        sameState: true,
        gstRate: settings.gstRate,
        cgstRate: settings.cgstRate,
        sgstRate: settings.sgstRate,
      })
      const status: SubscriptionStatus = input.trial ? "trial" : "active"
      const annualValue = calcARR(input.studentCount, rate, status)
      const exists = hostels.some(
        (h) =>
          h.hostelId === input.hostel.hostelId ||
          h._id === input.hostel.hostelId ||
          h.hostelCode === input.hostel.hostelCode
      )
      const opening = exists
        ? null
        : {
            invoiceNo: takeInvoiceNos(1)[0],
            requestNo: takeRequestNo(),
            requestId: uid("pr"),
          }

      setHostels((prev) => {
        const idx = prev.findIndex(
          (h) =>
            h.hostelId === input.hostel.hostelId ||
            h._id === input.hostel.hostelId ||
            h.hostelCode === input.hostel.hostelCode
        )
        const audit: AuditEvent = {
          id: uid("aud"),
          description: input.trial
            ? "Trial subscription saved — Elite trial month, all modules unlocked, billing ₹0"
            : `${input.plan} plan saved`,
          timestamp: dayjs().toISOString(),
          adminName: ADMIN_NAME,
        }

        if (idx >= 0) {
          const existing = prev[idx]
          const nextStatus: SubscriptionStatus = input.trial
            ? "trial"
            : existing.status === "trial" || existing.status === "expired" || existing.status === "deactivated"
              ? "active"
              : existing.status
          const next: HostelSubscription = {
            ...existing,
            hostelCode: input.hostel.hostelCode,
            name: input.hostel.name,
            city: input.hostel.city,
            state: input.hostel.state,
            adminName: input.hostel.adminName || existing.adminName,
            adminPhone: input.hostel.adminPhone || existing.adminPhone,
            plan: input.plan,
            studentCount: input.studentCount,
            activatedStudentCount: existing.activatedStudentCount || input.studentCount,
            addedStudentCount: Math.max(0, input.studentCount - (existing.activatedStudentCount || input.studentCount)),
            activeModules: modules,
            subscriptionStartDate: input.startDate,
            renewalDate,
            status: nextStatus,
            contractRate: rate,
            annualValue: calcARR(input.studentCount, rate, nextStatus),
            modulesLocked: false,
            trialLapsed: input.trial ? existing.trialLapsed : false,
            auditTrail: [audit, ...existing.auditTrail],
          }
          const copy = [...prev]
          copy[idx] = next
          return copy
        }

        if (!opening) return prev
        const dateGenerated = dayjs().format("YYYY-MM-DD")
        const openingRequest: PendingRequest = {
          id: opening.requestId,
          requestNo: opening.requestNo,
          type: "new_subscription",
          requestedBy: input.hostel.adminName || ADMIN_NAME,
          requestedByDesignation: "Warden",
          submittedOn: dateGenerated,
          status: "approved",
          planRequested: input.plan,
          studentCount: input.studentCount,
          modules,
          details: input.trial ? "Created with new hostel (trial)" : "Created with new hostel",
          billingCycle,
          subscriptionStartDate: input.startDate,
          renewalDate,
          startTrial: input.trial || undefined,
          trialDays: input.trial ? Math.max(1, input.trialDays || 30) : undefined,
        }
        const record: HostelSubscription = {
          _id: input.hostel.hostelId,
          hostelId: input.hostel.hostelId,
          hostelCode: input.hostel.hostelCode,
          name: input.hostel.name,
          city: input.hostel.city,
          state: input.hostel.state,
          adminName: input.hostel.adminName,
          adminPhone: input.hostel.adminPhone,
          plan: input.plan,
          status,
          billingCycle,
          studentCount: input.studentCount,
          activatedStudentCount: input.studentCount,
          addedStudentCount: 0,
          annualValue,
          contractRate: rate,
          subscriptionStartDate: input.startDate,
          renewalDate,
          activeModules: modules,
          pendingRequests: [openingRequest],
          invoices: [
            {
              id: uid("inv"),
              invoiceNo: opening.invoiceNo,
              billingPeriodStart: input.startDate,
              billingPeriodEnd: renewalDate,
              students: input.studentCount,
              amount: totals.taxable,
              gst: totals.gst,
              total: totals.total,
              status: input.trial ? "paid" : "unpaid",
              dateGenerated,
              sameState: true,
              dueDate: defaultInvoiceDueDate(dateGenerated),
              modules,
              plan: input.plan,
              rate,
              invoiceType: "annual_subscription",
              billingCycle,
              upgradeRequestId: opening.requestId,
              upgradeRequestNo: opening.requestNo,
            } satisfies Invoice,
          ],
          paymentProofs: [],
          auditTrail: [audit],
          notes: [] as AdminNote[],
        }
        return [record, ...prev]
      })
      toast.success("Subscription saved", toastOpts)
    },
    [hostels, pricing, settings, takeInvoiceNos, takeRequestNo]
  )

  const createLinkedInvoice = useCallback(
    (
      hostelId: string,
      draft: Omit<Invoice, "id" | "invoiceNo" | "upgradeRequestId" | "upgradeRequestNo" | "sameState">,
      requestInput: Pick<PendingRequest, "type"> &
        Partial<
          Pick<
            PendingRequest,
            | "planRequested"
            | "studentCount"
            | "modules"
            | "billingCycle"
            | "subscriptionStartDate"
            | "renewalDate"
            | "details"
          >
        >
    ) => {
      const hostel = hostels.find((h) => h.hostelId === hostelId || h._id === hostelId)
      if (!hostel) return
      const [invoiceNo] = takeInvoiceNos(1)
      const requestNo = takeRequestNo()
      const requestId = uid("pr")
      const submittedOn = dayjs().format("YYYY-MM-DD")
      const request: PendingRequest = {
        id: requestId,
        requestNo,
        type: requestInput.type,
        requestedBy: hostel.adminName,
        requestedByDesignation: "Warden",
        submittedOn,
        status: "approved",
        planRequested: requestInput.planRequested,
        studentCount: requestInput.studentCount,
        modules: requestInput.modules,
        details: requestInput.details ?? "Invoice issued for this upgrade request",
        billingCycle: requestInput.billingCycle,
        subscriptionStartDate: requestInput.subscriptionStartDate,
        renewalDate: requestInput.renewalDate,
      }
      const invoice: Invoice = {
        ...draft,
        id: uid("inv"),
        invoiceNo,
        sameState: true,
        upgradeRequestId: requestId,
        upgradeRequestNo: requestNo,
      }
      updateHostel(hostelId, (h) => ({
        ...h,
        pendingRequests: [request, ...h.pendingRequests],
        invoices: [invoice, ...h.invoices],
      }))
      addAudit(hostelId, `Invoice ${invoiceNo} created for ${requestNo}`, INVOICE_ACTOR)
      toast.success("Invoice sent", toastOpts)
    },
    [addAudit, hostels, takeInvoiceNos, takeRequestNo, updateHostel]
  )

  const value = useMemo<RevenueContextValue>(
    () => ({
      hostels,
      settings,
      planModules,
      planRates,
      customModuleRates,
      getHostel,
      updateHostel,
      addAudit,
      approveRequest,
      rejectRequest,
      holdRequest,
      addPendingRequest,
      withdrawPendingRequest,
      saveSettings,
      savePlanModules,
      savePricing,
      upsertSubscription,
      updateSubscription,
      nextInvoiceNo,
      createManualInvoice,
      updateManualInvoice,
      createLinkedInvoice,
      applyInvoiceDiscount,
    }),
    [
      hostels,
      settings,
      planModules,
      planRates,
      customModuleRates,
      getHostel,
      updateHostel,
      addAudit,
      approveRequest,
      rejectRequest,
      holdRequest,
      addPendingRequest,
      withdrawPendingRequest,
      saveSettings,
      savePlanModules,
      savePricing,
      upsertSubscription,
      updateSubscription,
      nextInvoiceNo,
      createManualInvoice,
      updateManualInvoice,
      createLinkedInvoice,
      applyInvoiceDiscount,
    ]
  )

  return <RevenueContext.Provider value={value}>{children}</RevenueContext.Provider>
}

export function useRevenue() {
  const ctx = useContext(RevenueContext)
  if (!ctx) throw new Error("useRevenue must be used within RevenueProvider")
  return ctx
}

export { toastOpts }
