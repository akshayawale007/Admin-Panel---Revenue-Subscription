"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import Select, {
  components,
  type DropdownIndicatorProps,
  type GroupBase,
  type GroupHeadingProps,
  type StylesConfig,
} from "react-select"
import Button from "@/component/Common/Button/Button"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { useReactSelectStyles } from "@/component/Common/Select/useReactSelectStyles"
import { MODULE_CATALOG, MODULE_PILL_CURRENT_BG, MODULE_PILL_CURRENT_TEXT, PLAN_COLORS, STANDARD_TIERS } from "@/lib/revenue/constants"
import { isValidGstin, planLabel } from "@/lib/revenue/utils"
import type { ModuleKey, PlanModuleConfig, PlanTier, RevenueSettings as RevenueSettingsType } from "@/lib/revenue/types"

type ModuleOption = { value: ModuleKey; label: string; minTier: PlanTier }
type ModuleGroup = GroupBase<ModuleOption> & { label: string; minTier: PlanTier; options: ModuleOption[] }

function PlanGroupHeading(props: GroupHeadingProps<ModuleOption, true, ModuleGroup>) {
  const tier = props.data.minTier
  const isFirst = tier === "PREMIUM"
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-bold tracking-wide uppercase text-(--yoco-text) ${
        isFirst ? "" : "mt-1 border-t border-(--yoco-border)"
      }`}
    >
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${PLAN_COLORS[tier].dotClass}`} />
      {props.children}
    </div>
  )
}

function PlanDropdownIndicator(props: DropdownIndicatorProps<ModuleOption, true, ModuleGroup>) {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDownIcon
        className={`size-4 shrink-0 text-(--yoco-text-muted) transition-transform duration-150 ${
          props.selectProps.menuIsOpen ? "rotate-180" : ""
        }`}
      />
    </components.DropdownIndicator>
  )
}

export default function RevenueSettings() {
  const { settings, saveSettings, planModules, savePlanModules, planRates, customModuleRates, savePricing } = useRevenue()
  const [invoice, setInvoice] = useState<RevenueSettingsType>(settings)
  const [gstError, setGstError] = useState("")
  const [grace, setGrace] = useState(settings.defaultGraceDays)
  const [trialDays, setTrialDays] = useState(settings.defaultTrialDays)
  const [modules, setModules] = useState<PlanModuleConfig>({ ...planModules, CUSTOM: [] })
  const [rates, setRates] = useState(planRates)
  const [moduleRates, setModuleRates] = useState(customModuleRates)

  const baseSelectStyles = useReactSelectStyles({ minHeight: 40, fontWeight: 500 })
  const selectStyles = useMemo<StylesConfig<ModuleOption, true, ModuleGroup>>(
    () => ({
      ...baseSelectStyles,
      control: (base, state) => {
        const themed =
          typeof baseSelectStyles.control === "function"
            ? (baseSelectStyles.control as (b: typeof base, s: typeof state) => typeof base)(base, state)
            : base
        return {
          ...themed,
          minHeight: 40,
          borderRadius: 8,
          boxShadow: state.isFocused ? "0 0 0 1px var(--yoco-primary)" : "none",
          borderColor: state.isFocused ? "var(--yoco-primary)" : "var(--yoco-input-border)",
          backgroundColor: "var(--yoco-input-bg)",
          cursor: "pointer",
          "&:hover": {
            borderColor: "var(--yoco-primary)",
          },
        }
      },
      dropdownIndicator: (base) => ({
        ...base,
        padding: "6px 10px 6px 2px",
        color: "var(--yoco-text-muted)",
        ":hover": { color: "var(--yoco-primary)" },
      }),
      clearIndicator: (base) => ({
        ...base,
        padding: "6px 4px",
        color: "var(--yoco-text-muted)",
        ":hover": { color: "var(--yoco-primary)" },
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
      indicatorsContainer: (base) => ({
        ...base,
        alignItems: "center",
        alignSelf: "stretch",
        paddingTop: 0,
      }),
      menu: (base) => ({
        ...base,
        zIndex: 999999,
        marginTop: 6,
        overflow: "hidden",
        borderRadius: 8,
        border: "1px solid var(--yoco-border-subtle)",
        backgroundColor: "var(--yoco-surface-elevated)",
        boxShadow: "0 8px 24px var(--yoco-shadow)",
      }),
      menuList: (base) => ({
        ...base,
        padding: 4,
      }),
      option: (base, state) => ({
        ...base,
        borderRadius: 6,
        padding: "8px 10px",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        backgroundColor: state.isSelected
          ? "var(--yoco-primary)"
          : state.isFocused
            ? "var(--yoco-row-hover)"
            : "transparent",
        color: state.isSelected ? "#ffffff" : "var(--yoco-text)",
        ":active": {
          backgroundColor: state.isSelected ? "var(--yoco-primary)" : "var(--yoco-row-hover)",
        },
      }),
      placeholder: (base) => ({
        ...base,
        color: "var(--yoco-text-muted)",
        fontWeight: 500,
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: MODULE_PILL_CURRENT_BG,
        borderRadius: 6,
        margin: 2,
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: MODULE_PILL_CURRENT_TEXT,
        fontWeight: 600,
        fontSize: 12,
        padding: "2px 8px",
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: MODULE_PILL_CURRENT_TEXT,
        borderRadius: 4,
        ":hover": {
          backgroundColor: "rgba(0,0,0,0.08)",
          color: MODULE_PILL_CURRENT_TEXT,
        },
      }),
    }),
    [baseSelectStyles]
  )

  const groupedByTier = useMemo<ModuleGroup[]>(
    () =>
      STANDARD_TIERS.map((tier) => ({
        label: planLabel(tier),
        minTier: tier,
        options: MODULE_CATALOG.filter((m) => m.minTier === tier).map((m) => ({
          value: m.key,
          label: m.name,
          minTier: m.minTier,
        })),
      })),
    []
  )

  const optionsForPlan = (tier: PlanTier) =>
    groupedByTier.slice(0, STANDARD_TIERS.indexOf(tier as (typeof STANDARD_TIERS)[number]) + 1)
  const flatOptions = groupedByTier.flatMap((g) => g.options)

  const saveAll = () => {
    if (!isValidGstin(invoice.gstin)) {
      setGstError("Enter a valid 15-character GSTIN")
      return
    }
    setGstError("")
    savePlanModules({ ...modules, CUSTOM: [] })
    savePricing({ planRates: rates, customModuleRates: moduleRates })
    saveSettings({
      ...invoice,
      gstin: invoice.gstin.toUpperCase(),
      cgstRate: Number(invoice.cgstRate) || 0,
      sgstRate: Number(invoice.sgstRate) || 0,
      gstRate: (Number(invoice.cgstRate) || 0) + (Number(invoice.sgstRate) || 0),
      defaultGraceDays: Math.max(0, Math.floor(Number(grace) || 0)),
      defaultTrialDays: Math.max(0, Math.floor(Number(trialDays) || 0)),
      reminderDays: settings.reminderDays,
      whatsappSenderName: settings.whatsappSenderName,
      whatsappSenderPhone: settings.whatsappSenderPhone,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-8">
      <div className="yoco-card flex flex-col gap-6 p-5">
        <section>
          <p className="text-sm font-semibold">Plan module matrix</p>
          <p className="mt-1 text-xs text-(--yoco-text-muted)">
            Custom plans stay labeled Custom. Packaged rates apply when a new selection contains a full plan bundle;
            extra modules use the custom module rates below. Catalog prices apply to new hostels, renewals, and newly
            added custom modules. Current subscriptions keep their contracted rate until then.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {STANDARD_TIERS.map((tier) => (
              <div key={tier}>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-(--yoco-text)">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${PLAN_COLORS[tier].dotClass}`} />
                    {planLabel(tier)}
                  </p>
                  <label className="flex items-center gap-1.5 text-xs text-(--yoco-text-muted)">
                    ₹
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="yoco-input !w-16 shrink-0 px-2 py-1 text-sm font-semibold text-(--yoco-text)"
                      value={rates[tier]}
                      onChange={(e) =>
                        setRates((prev) => ({ ...prev, [tier]: Number(e.target.value) }))
                      }
                    />
                    /seat/month
                  </label>
                </div>
                <Select<ModuleOption, true, ModuleGroup>
                  isMulti
                  isClearable={false}
                  options={optionsForPlan(tier)}
                  styles={selectStyles}
                  classNamePrefix="yoco-plan-select"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                  menuPosition="fixed"
                  components={{
                    GroupHeading: PlanGroupHeading,
                    DropdownIndicator: PlanDropdownIndicator,
                    IndicatorSeparator: () => null,
                  }}
                  value={flatOptions.filter((o) => modules[tier].includes(o.value))}
                  onChange={(vals) =>
                    setModules((prev) => ({
                      ...prev,
                      [tier]: vals.map((v) => v.value),
                      CUSTOM: [],
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-(--yoco-border-subtle) pt-5">
          <p className="text-sm font-semibold">Custom module rates</p>
          <p className="mt-1 text-xs text-(--yoco-text-muted)">
            Used only for modules added on a Custom selection that sit outside the highest complete packaged plan
            in that selection. Changing these rates does not rewrite current hostel contracts or existing invoices.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {MODULE_CATALOG.map((mod) => (
              <label
                key={mod.key}
                className="flex items-center justify-between gap-2 rounded-lg border border-(--yoco-border-subtle) px-2.5 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-(--yoco-text)">{mod.name}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-(--yoco-text-muted)">
                    {planLabel(mod.minTier)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm">
                  ₹
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="yoco-input !w-14 shrink-0 px-1.5 py-1 text-sm font-semibold text-(--yoco-text)"
                    value={moduleRates[mod.key] ?? 0}
                    onChange={(e) =>
                      setModuleRates((prev) => ({ ...prev, [mod.key]: Number(e.target.value) }))
                    }
                  />
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="border-t border-(--yoco-border-subtle) pt-5">
          <p className="text-sm font-semibold">Configuration</p>
          <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Company name">
              <input
                className="yoco-input px-3 py-1.5"
                value={invoice.companyName}
                onChange={(e) => setInvoice({ ...invoice, companyName: e.target.value })}
              />
            </Field>
            <Field label="GSTIN" error={gstError}>
              <input
                className="yoco-input px-3 py-1.5"
                value={invoice.gstin}
                onChange={(e) => setInvoice({ ...invoice, gstin: e.target.value })}
              />
            </Field>
            <Field label="Invoice prefix">
              <input
                className="yoco-input px-3 py-1.5"
                value={invoice.invoicePrefix}
                onChange={(e) => setInvoice({ ...invoice, invoicePrefix: e.target.value })}
              />
            </Field>
            <Field label="Starting sequence">
              <input
                type="number"
                className="yoco-input px-3 py-1.5"
                value={invoice.invoiceSequence}
                onChange={(e) => setInvoice({ ...invoice, invoiceSequence: Number(e.target.value) })}
              />
            </Field>
            <Field label="CGST %">
              <input
                type="number"
                min={0}
                step="0.01"
                className="yoco-input px-3 py-1.5"
                value={invoice.cgstRate}
                onChange={(e) => {
                  const cgstRate = Number(e.target.value)
                  setInvoice({ ...invoice, cgstRate, gstRate: cgstRate + invoice.sgstRate })
                }}
              />
            </Field>
            <Field label="SGST %">
              <input
                type="number"
                min={0}
                step="0.01"
                className="yoco-input px-3 py-1.5"
                value={invoice.sgstRate}
                onChange={(e) => {
                  const sgstRate = Number(e.target.value)
                  setInvoice({ ...invoice, sgstRate, gstRate: invoice.cgstRate + sgstRate })
                }}
              />
            </Field>
            <Field label="Logo">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="min-w-0 flex-1 text-xs"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => setInvoice({ ...invoice, logoDataUrl: String(reader.result) })
                    reader.readAsDataURL(file)
                  }}
                />
                {invoice.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invoice.logoDataUrl} alt="logo preview" className="h-8 w-8 shrink-0 object-contain" />
                ) : null}
              </div>
            </Field>
            <Field label="Company address" className="sm:col-span-2">
              <input
                className="yoco-input px-3 py-1.5"
                value={invoice.companyAddress}
                onChange={(e) => setInvoice({ ...invoice, companyAddress: e.target.value })}
              />
            </Field>
            <Field label="Trial period days">
              <input
                type="number"
                min={0}
                className="yoco-input px-3 py-1.5"
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
              />
            </Field>
            <Field label="Grace period days">
              <input
                type="number"
                min={0}
                className="yoco-input px-3 py-1.5"
                value={grace}
                onChange={(e) => setGrace(Number(e.target.value))}
              />
            </Field>
          </div>
        </section>

        <div className="flex justify-end">
          <Button title="Save" onClick={saveAll} />
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--yoco-text-muted)">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
