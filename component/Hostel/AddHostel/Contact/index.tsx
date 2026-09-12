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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: "contact1" | "contact2" | "contact3") => {
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
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Contact No. 1 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register("contact1")}
            onChange={(e) => handlePhoneChange(e, "contact1")}
            className={inputClass}
          />
          {errors?.contact1 && (
            <p className="text-xs font-semibold text-rose-500">{errors.contact1.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">Contact No. 2</label>
          <input
            type="text"
            {...register("contact2")}
            onChange={(e) => handlePhoneChange(e, "contact2")}
            className={inputClass}
          />
          {errors?.contact2 && (
            <p className="text-xs font-semibold text-rose-500">{errors.contact2.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">Contact No. 3</label>
          <input
            type="text"
            {...register("contact3")}
            onChange={(e) => handlePhoneChange(e, "contact3")}
            className={inputClass}
          />
          {errors?.contact3 && (
            <p className="text-xs font-semibold text-rose-500">{errors.contact3.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
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
