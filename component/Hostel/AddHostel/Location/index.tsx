"use client"

import { useMemo } from "react"
import Select from "react-select"
import { useReactSelectStyles } from "@/component/Common/Select/useReactSelectStyles"
import { CITIES_BY_STATE, COUNTRIES, STATES_BY_COUNTRY } from "@/lib/hostel/constants"
import type { HostelFormProps } from "../formTypes"

const Location = ({ setValue, register, watch, errors }: HostelFormProps) => {
  const selectStyles = useReactSelectStyles()
  const country = watch("country")
  const state = watch("state")
  const countryValue = country && typeof country === "object" ? country.value : ""
  const stateValue = state && typeof state === "object" ? state.value : ""

  const states = useMemo(() => (countryValue ? STATES_BY_COUNTRY[countryValue] ?? [] : []), [countryValue])
  const cities = useMemo(() => (stateValue ? CITIES_BY_STATE[stateValue] ?? [] : []), [stateValue])
  const inputClass = "yoco-form-input-field px-3 py-2 placeholder:text-xs placeholder:font-normal"

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Location</p>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Country <span className="text-rose-500">*</span>
          </label>
          <Select
            value={watch("country")}
            isClearable
            onChange={(e) => {
              setValue("country", e as never, { shouldValidate: true })
              setValue("state", null as never)
              setValue("city", null as never)
            }}
            options={COUNTRIES as never}
            placeholder="Select country..."
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            styles={selectStyles}
          />
          {errors?.country && (
            <p className="text-xs font-semibold text-rose-500">{errors.country.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Pin Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register("pincode")}
            onChange={(e) => {
              const value = e.target.value.replace(/^\s+/, "").replace(/\D/g, "").slice(0, 6)
              setValue("pincode", value, { shouldValidate: true })
            }}
            className={inputClass}
          />
          {errors?.pincode && (
            <p className="text-xs font-semibold text-rose-500">{errors.pincode.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            State <span className="text-rose-500">*</span>
          </label>
          <Select
            value={watch("state")}
            isClearable
            onChange={(e) => {
              setValue("state", e as never, { shouldValidate: true })
              setValue("city", null as never)
            }}
            options={states as never}
            placeholder="Select state..."
            isDisabled={!country}
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            styles={selectStyles}
          />
          {errors?.state && (
            <p className="text-xs font-semibold text-rose-500">{errors.state.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            City/District <span className="text-rose-500">*</span>
          </label>
          <Select
            value={watch("city")}
            isClearable
            onChange={(e) => setValue("city", e as never, { shouldValidate: true })}
            options={cities as never}
            placeholder="Select city..."
            isDisabled={!state}
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            styles={selectStyles}
          />
          {errors?.city && (
            <p className="text-xs font-semibold text-rose-500">{errors.city.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register("address")}
            onChange={(e) =>
              setValue("address", e.target.value.replace(/^\s+/, ""), { shouldValidate: true })
            }
            placeholder="Line 1"
            className={inputClass}
          />
          {errors?.address && (
            <p className="text-xs font-semibold text-rose-500">{errors.address.message as string}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">Address</label>
          <input
            type="text"
            {...register("landmark")}
            onChange={(e) =>
              setValue("landmark", e.target.value.replace(/^\s+/, ""), { shouldValidate: true })
            }
            placeholder="Line 2"
            className={inputClass}
          />
          {errors?.landmark && (
            <p className="text-xs font-semibold text-rose-500">{errors.landmark.message as string}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Location
