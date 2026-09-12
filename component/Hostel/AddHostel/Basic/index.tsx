"use client"

import Select from "react-select"
import { useReactSelectStyles } from "@/component/Common/Select/useReactSelectStyles"
import { HOSTEL_TYPE_OPTIONS, OWNERSHIP_OPTIONS } from "@/lib/hostel/constants"
import Affiliation from "../Affiliation"
import type { HostelFormProps } from "../formTypes"

const Basic = ({ setValue, register, watch, errors }: HostelFormProps) => {
  const selectStyles = useReactSelectStyles()

  return (
    <div className="yoco-form-section w-full p-4 sm:p-6">
      <p className="yoco-form-title mb-4">Basic Details</p>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Hostel Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            className="yoco-form-input-field px-3 py-2 placeholder:text-xs placeholder:font-normal"
            {...register("hostelName")}
            onChange={(e) => {
              let value = e.target.value.replace(/^\s+/, "").replace(/[^a-zA-Z\s]/g, "")
              setValue("hostelName", value, { shouldValidate: true })
            }}
          />
          {errors?.hostelName?.message && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.hostelName.message as string}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Hostel Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register("hostelCode")}
            onChange={(e) => {
              const value = e.target.value.replace(/^\s+/, "")
              setValue("hostelCode", value, { shouldValidate: true })
            }}
            className="yoco-form-input-field px-3 py-2 placeholder:text-xs placeholder:font-normal"
          />
          {errors?.hostelCode?.message && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.hostelCode.message as string}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Hostel Type <span className="text-rose-500">*</span>
          </label>
          <Select
            value={watch("hostelType")}
            isClearable
            onChange={(e) => setValue("hostelType", e as never, { shouldValidate: true })}
            options={HOSTEL_TYPE_OPTIONS}
            placeholder="Select type..."
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            styles={selectStyles}
          />
          {errors?.hostelType?.message && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.hostelType.message as string}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">Description</label>
          <input
            type="text"
            {...register("description")}
            onChange={(e) =>
              setValue("description", e.target.value.replace(/^\s+/, ""), { shouldValidate: true })
            }
            className="yoco-form-input-field px-3 py-2 placeholder:text-xs placeholder:font-normal"
          />
          {errors?.description && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.description.message as string}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Student ID Prefix <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register("studentPrifix")}
            onChange={(e) =>
              setValue("studentPrifix", e.target.value.replace(/^\s+/, ""), { shouldValidate: true })
            }
            className="yoco-form-input-field px-3 py-2 placeholder:text-xs placeholder:font-normal"
          />
          {errors?.studentPrifix?.message && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.studentPrifix.message as string}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">
            Ownership Type <span className="text-rose-500">*</span>
          </label>
          <Select
            value={watch("ownerShipType")}
            isClearable
            onChange={(e) => setValue("ownerShipType", e as never, { shouldValidate: true })}
            options={OWNERSHIP_OPTIONS}
            placeholder="Select ownership..."
            menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            styles={selectStyles}
          />
          {errors.ownerShipType?.message && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.ownerShipType.message as string}
            </p>
          )}
        </div>
      </div>
      <Affiliation setValue={setValue} register={register} watch={watch} errors={errors} />
    </div>
  )
}

export default Basic
