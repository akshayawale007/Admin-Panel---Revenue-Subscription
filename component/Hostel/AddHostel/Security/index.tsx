"use client"

import Select from "react-select"
import { useReactSelectStyles } from "@/component/Common/Select/useReactSelectStyles"
import { YES_NO_OPTIONS } from "@/lib/hostel/constants"
import type { HostelFormProps } from "../formTypes"

const Security = ({ setValue, watch }: HostelFormProps) => {
  const selectStyles = useReactSelectStyles()

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Security</p>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">Availability</label>
          <Select
            value={watch("security_availability")}
            isClearable
            onChange={(e) => setValue("security_availability", e, { shouldValidate: true })}
            options={YES_NO_OPTIONS}
            placeholder="Select..."
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            styles={selectStyles}
          />
        </div>
      </div>
    </div>
  )
}

export default Security
