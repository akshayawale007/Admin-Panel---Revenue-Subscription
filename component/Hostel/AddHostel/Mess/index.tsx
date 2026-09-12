"use client"

import Select from "react-select"
import { useReactSelectStyles } from "@/component/Common/Select/useReactSelectStyles"
import { YES_NO_OPTIONS } from "@/lib/hostel/constants"
import type { HostelFormProps } from "../formTypes"

const Mess = ({ setValue, register, errors, watch }: HostelFormProps) => {
  const selectStyles = useReactSelectStyles()

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Mess</p>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">Availability</label>
          <Select
            value={watch("availability") || null}
            isClearable
            onChange={(e) => setValue("availability", e, { shouldValidate: true })}
            options={YES_NO_OPTIONS}
            placeholder="Select..."
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            styles={selectStyles}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">Description</label>
          <input
            type="text"
            {...register("mess_description")}
            onChange={(e) =>
              setValue("mess_description", e.target.value.replace(/^\s+/, ""), {
                shouldValidate: true,
              })
            }
            className="yoco-form-input-field px-3 py-2 placeholder:text-xs placeholder:font-normal"
          />
          {errors?.mess_description && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.mess_description.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Mess
