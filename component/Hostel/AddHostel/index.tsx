"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { useRouter } from "next/navigation"
import Button from "@/component/Common/Button/Button"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"
import { useHostel } from "@/component/Hostel/HostelProvider"
import { useRevenue } from "@/component/Revenue/RevenueProvider"
import { hostelPayload, hostelSchema } from "@/validationSchema/hostel"
import { OWNERSHIP_OPTIONS, YES_NO_OPTIONS } from "@/lib/hostel/constants"
import { DEFAULT_PLAN_MODULES } from "@/lib/revenue/constants"
import { normalizeVisitingHours } from "@/utils/timeUtils"
import type { PlanTier } from "@/lib/revenue/types"
import Basic from "./Basic"
import Location from "./Location"
import Contact from "./Contact"
import Subscription from "./Subscription"
import Mess from "./Mess"
import Amenities from "./Amenities"
import Security from "./Security"
import LegalDocumentation from "./LegalDocumentation"
import dayjs from "dayjs"

const AddHostel = () => {
  const [activeTab, setActiveTab] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { currentHostel, saveHostel, setDraftDocs } = useHostel()
  const { getHostel: getSubscription, upsertSubscription } = useRevenue()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<hostelPayload>({
    defaultValues: {
      country: null,
      state: null,
      city: null,
      collegeId: null,
      universityId: null,
      visitingHoursStart: "",
      visitingHoursEnd: "",
      availability: null,
      staffCount: 0,
      subscriptionPlan: "ELITE",
      subscriptionStudentCount: 50,
      subscriptionModules: DEFAULT_PLAN_MODULES.ELITE,
      subscriptionStartDate: "",
      subscriptionRenewalDate: "",
      subscriptionTrial: true,
      subscriptionTrialDays: 30,
      subscriptionBillingCycle: undefined,
    } as unknown as hostelPayload,
    resolver: yupResolver(hostelSchema) as never,
  })

  const isEdit = Boolean(currentHostel?._id)
  const tabs = ["Basic", "Location", "Contact", "Subscription", "Mess", "Amenities", "Security", "Documents"]
  const formProps = { setValue, register, errors, watch }
  const tabContent = [
    <Basic key="basic" {...formProps} />,
    <Location key="loc" {...formProps} />,
    <Contact key="contact" {...formProps} />,
    <Subscription
      key="subscription"
      {...formProps}
      readOnly={isEdit}
      hostelId={currentHostel?._id}
    />,
    <Mess key="mess" {...formProps} />,
    <Amenities key="am" {...formProps} />,
    <Security key="sec" {...formProps} />,
    <LegalDocumentation key="docs" />,
  ]

  useEffect(() => {
    const details = currentHostel
    if (!details) {
      const start = dayjs().format("YYYY-MM-DD")
      setDraftDocs([])
      setValue("staffCount", 0)
      setValue("subscriptionPlan", "ELITE")
      setValue("subscriptionStudentCount", 50)
      setValue("subscriptionModules", DEFAULT_PLAN_MODULES.ELITE)
      setValue("subscriptionStartDate", start)
      setValue("subscriptionTrialDays", 30)
      setValue("subscriptionRenewalDate", dayjs(start).add(30, "day").format("YYYY-MM-DD"))
      setValue("subscriptionTrial", true)
      setValue("subscriptionBillingCycle", undefined)
      return
    }
    setDraftDocs(details.legalDocs)
    setValue("_id", details._id)
    setValue("hostelName", details.name)
    setValue("hostelCode", details.hostelCode)
    setValue("staffCount", details.staffCount ?? 0)
    setValue("studentPrifix", details.studentPrifix)
    setValue("description", details.description)
    setValue("hostelType", { label: details.hostelType, value: details.hostelType })
    const ownership =
      OWNERSHIP_OPTIONS.find((o) => o.label === details.ownerShipType) ?? {
        label: details.ownerShipType,
        value: details.ownerShipType,
      }
    setValue("ownerShipType", ownership)
    setValue("country", { ...details.country, name: details.country.name ?? details.country.label })
    setValue("state", { ...details.state, name: details.state.name ?? details.state.label })
    setValue("city", { ...details.city, name: details.city.name ?? details.city.label })
    setValue("pincode", details.pincode)
    setValue("address", details.address)
    setValue("landmark", details.landmark)
    setValue("universityId", details.universityId)
    setValue("collegeId", details.collegeId)
    setValue("contact1", details.contact1)
    setValue("contact2", details.contact2)
    setValue("contact3", details.contact3)
    setValue("visitingHoursStart", normalizeVisitingHours(details.visitingHoursStart))
    setValue("visitingHoursEnd", normalizeVisitingHours(details.visitingHoursEnd))
    setValue(
      "availability",
      details.messAvailable ? YES_NO_OPTIONS[0] : YES_NO_OPTIONS[1]
    )
    setValue(
      "security_availability",
      details.securityAvailable ? YES_NO_OPTIONS[0] : YES_NO_OPTIONS[1]
    )
    setValue("mess_description", details.messDescription)
    setValue(
      "ammenities",
      details.amenities.map((a) => ({ label: a.name, value: a._id }))
    )
    const subscription =
      getSubscription(details._id) ?? getSubscription(details.hostelCode)
    if (subscription) {
      const plan = (subscription.plan ?? "PREMIUM") as PlanTier
      setValue("subscriptionPlan", plan)
      setValue("subscriptionStudentCount", subscription.studentCount)
      setValue("subscriptionModules", subscription.activeModules)
      setValue("subscriptionStartDate", subscription.subscriptionStartDate)
      setValue("subscriptionRenewalDate", subscription.renewalDate)
      setValue("subscriptionTrial", subscription.status === "trial")
      setValue("subscriptionBillingCycle", subscription.billingCycle)
    } else {
      const start = dayjs().format("YYYY-MM-DD")
      setValue("subscriptionPlan", "ELITE")
      setValue("subscriptionStudentCount", 50)
      setValue("subscriptionModules", DEFAULT_PLAN_MODULES.ELITE)
      setValue("subscriptionStartDate", start)
      setValue("subscriptionTrialDays", 30)
      setValue("subscriptionRenewalDate", dayjs(start).add(30, "day").format("YYYY-MM-DD"))
      setValue("subscriptionTrial", true)
      setValue("subscriptionBillingCycle", undefined)
    }
  }, [currentHostel, getSubscription, setDraftDocs, setValue])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 8) {
        setActiveTab(tabs.length - 1)
        return
      }
      const containerTop = container.getBoundingClientRect().top
      let currentIndex = 0
      tabs.forEach((_, i) => {
        const section = document.getElementById(`section-${i}`)
        if (!section) return
        if (section.getBoundingClientRect().top - containerTop <= 50) currentIndex = i
      })
      setActiveTab(currentIndex)
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [tabs.length])

  const scrollToSection = (index: number) => {
    const container = scrollRef.current
    const element = document.getElementById(`section-${index}`)
    if (!container || !element) return
    const offset =
      element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
    container.scrollTo({ top: offset, behavior: "smooth" })
    setActiveTab(index)
  }

  const onSubmit = (values: hostelPayload) => {
    const saved = saveHostel(values as never)
    if (!isEdit) {
      const trial = Boolean(values.subscriptionTrial)
      const trialDays = Math.max(1, Math.floor(Number(values.subscriptionTrialDays) || 30))
      const start = values.subscriptionStartDate || dayjs().format("YYYY-MM-DD")
      const renewal =
        values.subscriptionRenewalDate || dayjs(start).add(trialDays, "day").format("YYYY-MM-DD")
      upsertSubscription({
        hostel: {
          hostelId: saved._id,
          hostelCode: saved.hostelCode,
          name: saved.name,
          city: saved.city.name ?? saved.city.label,
          state: saved.state.name ?? saved.state.label,
          adminName: saved.name,
          adminPhone: saved.contact1,
        },
        plan: values.subscriptionPlan,
        studentCount: values.subscriptionStudentCount,
        modules: (values.subscriptionModules ?? []).filter((key): key is string => Boolean(key)),
        startDate: start,
        renewalDate: renewal,
        trial,
        trialDays: trial ? trialDays : undefined,
        billingCycle: trial ? undefined : values.subscriptionBillingCycle ?? undefined,
      })
    }
    router.push("/hostel/")
  }

  const customNavbar = (
    <AppNavbar back title={isEdit ? "Edit Hostel" : "Add Hostel"} onBack={() => router.push("/hostel/")}>
      {isEdit && (
        <>
          <Button title="Amenities" onClick={() => router.push("/hostel/hostel-amenities/")} />
          <Button title="Room Mapping" onClick={() => router.push("/hostel/room-mapping/")} />
        </>
      )}
    </AppNavbar>
  )

  const panelHeight = "calc(100vh - 6rem)"

  return (
    <LayoutWrapper navbar={customNavbar}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex w-full gap-2 overflow-x-auto rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) p-2 shadow-sm lg:hidden">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              onClick={() => scrollToSection(index)}
              className={`shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === index
                  ? "bg-[#674D9F] text-white"
                  : "text-(--yoco-text) hover:bg-[#674D9F]/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <aside className="hidden w-44 shrink-0 lg:block lg:w-48">
          <nav
            className="flex flex-col gap-1 rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) p-3 shadow-md"
            style={{ height: panelHeight }}
          >
            {tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                onClick={() => scrollToSection(index)}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeTab === index
                    ? "bg-[#674D9F] text-white shadow-sm"
                    : "text-(--yoco-text) hover:bg-[#674D9F]/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col" style={{ height: panelHeight }}>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            {tabs.map((tab, index) => (
              <div
                key={tab}
                id={`section-${index}`}
                className={index === tabs.length - 1 ? "mb-2" : "mb-5"}
              >
                {tabContent[index]}
              </div>
            ))}
          </div>
          <div className="flex shrink-0 justify-end rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) px-4 py-2 shadow-sm">
            <Button title="Done" onClick={handleSubmit(onSubmit)} />
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default AddHostel
