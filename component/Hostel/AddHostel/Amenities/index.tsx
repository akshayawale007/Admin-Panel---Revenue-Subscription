"use client"

import Select from "react-select"
import { useReactSelectStyles } from "@/component/Common/Select/useReactSelectStyles"
import { AMENITY_CATALOG } from "@/lib/hostel/constants"
import type { HostelFormProps } from "../formTypes"

const amenityOptions = AMENITY_CATALOG.map((a) => ({ label: a.name, value: a._id }))

const Amenities = ({ setValue, watch }: HostelFormProps) => {
  const selectStyles = useReactSelectStyles()

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Amenities</p>
      <div className="flex flex-col gap-1">
        <label className="yoco-form-label font-normal">Defaults</label>
        <Select
          value={watch("ammenities") as { label: string; value: string }[] | undefined}
          isMulti
          isClearable
          onChange={(e) => setValue("ammenities", e as never, { shouldValidate: true })}
          options={amenityOptions}
          placeholder="Select amenities..."
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
          styles={selectStyles}
        />
      </div>
    </div>
  )
}

export default Amenities
