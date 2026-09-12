"use client"

import { useMemo, useState } from "react"
import DebounceAsyncSearch from "@/component/Common/DebounceSearch/DebounceSearch"
import { COLLEGES_BY_UNIVERSITY, UNIVERSITIES } from "@/lib/hostel/constants"
import type { HostelFormProps } from "../formTypes"

const Affiliation = ({ setValue, register, watch, errors }: HostelFormProps) => {
  const [uniQuery, setUniQuery] = useState("")
  const [collegeQuery, setCollegeQuery] = useState("")
  const selectedUniversity = watch("universityId")
  const uniValue =
    selectedUniversity && typeof selectedUniversity === "object"
      ? (selectedUniversity as { value?: string }).value
      : undefined

  const universityOptions = useMemo(() => {
    const q = uniQuery.trim().toLowerCase()
    return UNIVERSITIES.filter((u) => !q || u.label.toLowerCase().includes(q))
  }, [uniQuery])

  const collegeOptions = useMemo(() => {
    if (!uniValue) return []
    const q = collegeQuery.trim().toLowerCase()
    return (COLLEGES_BY_UNIVERSITY[uniValue] ?? []).filter(
      (c) => !q || c.label.toLowerCase().includes(q)
    )
  }, [uniValue, collegeQuery])

  return (
    <div className="mt-5">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">University</label>
          <DebounceAsyncSearch
            watch={watch}
            setValue={setValue}
            register={register}
            name="universityId"
            options={universityOptions}
            onSearch={setUniQuery}
            onChange={() => {
              setValue("collegeId", null, { shouldValidate: true })
              setCollegeQuery("")
            }}
          />
          {errors?.universityId && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.universityId.message as string}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="yoco-form-label font-normal">College</label>
          <DebounceAsyncSearch
            watch={watch}
            setValue={setValue}
            register={register}
            name="collegeId"
            options={collegeOptions}
            onSearch={setCollegeQuery}
            disabled={!uniValue}
          />
          {errors?.collegeId && (
            <p className="text-xs font-semibold text-rose-500">
              {errors.collegeId.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Affiliation
