import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import type { hostelPayload } from "@/validationSchema/hostel"

export type HostelFormProps = {
  setValue: UseFormSetValue<hostelPayload>
  register: UseFormRegister<hostelPayload>
  watch: UseFormWatch<hostelPayload>
  errors: FieldErrors<hostelPayload>
  readOnly?: boolean
  hostelId?: string
}
