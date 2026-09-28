"use client"

import { TimePicker } from "antd"
import dayjs from "dayjs"
import { normalizeVisitingHours } from "@/utils/timeUtils"
import type { HostelFormProps } from "../formTypes"

const Contact = ({ setValue, register, watch, errors }: HostelFormProps) => {
  const inputClass = "yoco-form-input-field px-3 py-2 placeholder:text-xs placeholder:font-normal"

  const parseTime = (val: string | null | undefined) => {
    if (!normalizeVisitingHours(val)) return null
    const parsed = dayjs(val as string, ["HH:mm:ss", "HH:mm", "hh:mm A", "hh:mm:ss A"])
    return parsed.isValid() ? parsed : null
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: "contactMobile1" | "contactMobile2") => {
    const value = e.target.value.replace(/^\s+/, "").replace(/\D/g, "").slice(0, 10)
    setValue(field, value, { shouldValidate: true })
  }

  const timePickerStyle = (hasError?: boolean): React.CSSProperties => ({
    height: "38px",
    flex: 1,
    minWidth: "120px",
    width: "100%",
    ...(hasError ? { borderColor: "#f43f5e" } : {}),
  })

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Contact/Visit</p>
      <div className="flex w-full flex-col gap-4 sm:gap-6">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">
              Name 1 <span className="text-rose-500">*</span>
            </label>
            <input type="text" {...register("contactName1")} className={inputClass} />
            {errors?.contactName1 && (
              <p className="text-xs font-semibold text-rose-500">{errors.contactName1.message as string}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">
              Mobile no. 1 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register("contactMobile1")}
              onChange={(e) => handlePhoneChange(e, "contactMobile1")}
              className={inputClass}
            />
            {errors?.contactMobile1 && (
              <p className="text-xs font-semibold text-rose-500">{errors.contactMobile1.message as string}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">
              Email 1 <span className="text-rose-500">*</span>
            </label>
            <input type="email" {...register("contactEmail1")} className={inputClass} />
            {errors?.contactEmail1 && (
              <p className="text-xs font-semibold text-rose-500">{errors.contactEmail1.message as string}</p>
            )}
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">Name 2</label>
            <input type="text" {...register("contactName2")} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">Mobile no. 2</label>
            <input
              type="text"
              {...register("contactMobile2")}
              onChange={(e) => handlePhoneChange(e, "contactMobile2")}
              className={inputClass}
            />
            {errors?.contactMobile2 && (
              <p className="text-xs font-semibold text-rose-500">{errors.contactMobile2.message as string}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="yoco-form-label font-normal">Email 2</label>
            <input type="email" {...register("contactEmail2")} className={inputClass} />
            {errors?.contactEmail2 && (
              <p className="text-xs font-semibold text-rose-500">{errors.contactEmail2.message as string}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:max-w-md">
          <label className="yoco-form-label font-normal">Visiting Hours</label>
          <div className="flex flex-wrap items-center gap-2">
            <TimePicker
              value={parseTime(watch("visitingHoursStart"))}
              onChange={(_time, timeString) => {
                setValue("visitingHoursStart", timeString as string, { shouldValidate: true })
              }}
              format="HH:mm"
              use12Hours
              placeholder="Start time"
              style={timePickerStyle(!!errors?.visitingHoursStart)}
            />
            <TimePicker
              value={parseTime(watch("visitingHoursEnd"))}
              onChange={(_time, timeString) => {
                setValue("visitingHoursEnd", timeString as string, { shouldValidate: true })
              }}
              format="HH:mm"
              use12Hours
              placeholder="End time"
              style={timePickerStyle(!!errors?.visitingHoursEnd)}
            />
          </div>
          {errors?.visitingHoursEnd && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.visitingHoursEnd.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Contact
