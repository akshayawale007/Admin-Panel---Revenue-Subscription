import * as yup from "yup"
import dayjs from "dayjs"

const parseTime = (val: string) => {
  if (!val) return null
  const parsed = dayjs(val, ["HH:mm:ss", "HH:mm", "hh:mm A", "hh:mm:ss A"])
  return parsed.isValid() ? parsed : null
}

const locationOptionSchema = yup
  .object({
    label: yup.string().required(),
    value: yup.string().required(),
    name: yup.string().required(),
  })
  .nullable()
  .default(null)

const cityOptionSchema = yup
  .object({
    label: yup.string().required(),
    value: yup.string().required(),
    name: yup.string().required(),
    cityId: yup.number(),
  })
  .nullable()
  .default(null)

const basicOptionSchema = yup
  .object({
    label: yup.string().required(),
    value: yup.string().required(),
  })
  .nullable()
  .default(null)

export const hostelSchema = yup.object({
  status: yup.boolean(),
  _id: yup.string().nullable().optional().default(null),
  hostelName: yup
    .string()
    .max(100, "Hostel Name must be at most 100 characters")
    .required("Hostel name is required."),
  hostelType: basicOptionSchema.required("Hostel Type is required."),
  studentPrifix: yup
    .string()
    .max(50, "Student ID Prefix must be at most 50 characters")
    .required("Student Prefix is required."),
  hostelCode: yup
    .string()
    .max(50, "Hostel Code must be at most 100 characters")
    .required("Hostel Code is required."),
  ownerShipType: basicOptionSchema.required("Owner Ship is required."),
  description: yup
    .string()
    .max(200, "Description must be at most 100 characters.")
    .optional()
    .nullable(),
  country: locationOptionSchema.required("Country is required."),
  pincode: yup.string().max(6, "Pincode must be at most 6 digits").required("PinCode is required."),
  state: locationOptionSchema.required("State is required."),
  city: cityOptionSchema.required("City is required."),
  address: yup
    .string()
    .max(200, "Address must be at most 200 characters")
    .required("Address is required."),
  landmark: yup.string().max(200, "Addrress must be at most 200 characters").optional().nullable(),
  universityId: basicOptionSchema.optional(),
  collegeId: basicOptionSchema.nullable().when("universityId", {
    is: (val: unknown) => Boolean(val && typeof val === "object" && Object.keys(val as object).length > 0),
    then: (schema) => schema.required("College is required when university is selected"),
    otherwise: (schema) => schema.optional(),
  }),
  contact1: yup
    .string()
    .min(10, "Contact must be at least 10 digits")
    .max(10, "Contact must be at most 10 digits")
    .required("Contact is required."),
  contact2: yup
    .string()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .test("len", "Contact must be at least 10 digits", (value) => !value || value.length === 10),
  contact3: yup
    .string()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .test("len", "Contact must be at least 10 digits", (value) => !value || value.length === 10),
  visitingHoursStart: yup.string().nullable(),
  visitingHoursEnd: yup
    .string()
    .nullable()
    .test("end-greater-than-start", "End Time must be greater than Start Time.", function (value) {
      const { visitingHoursStart } = this.parent
      if (!visitingHoursStart) return true
      if (!value) return this.createError({ message: "End Time is required." })
      const start = parseTime(visitingHoursStart)
      const end = parseTime(value)
      if (!start || !end) return false
      return end.isAfter(start)
    }),
  availability: basicOptionSchema.optional(),
  mess_description: yup
    .string()
    .max(200, "Description must be at most 100 characters.")
    .optional()
    .nullable(),
  defaults: yup.array().of(yup.string()).optional(),
  security_availability: basicOptionSchema.optional(),
  files: yup.array().of(yup.string()).optional(),
  ammenities: yup.array().of(yup.object()).optional(),
  subscriptionPlan: yup
    .mixed<"PREMIUM" | "ADVANCED" | "ELITE" | "CUSTOM">()
    .oneOf(["PREMIUM", "ADVANCED", "ELITE", "CUSTOM"])
    .required("Plan is required."),
  staffCount: yup
    .number()
    .typeError("Seat count (Staff) is required.")
    .min(0, "Seat count (Staff) cannot be negative")
    .required("Seat count (Staff) is required."),
  subscriptionStudentCount: yup
    .number()
    .typeError("Seat count (Students) is required.")
    .min(1, "Seat count (Students) must be at least 1")
    .required("Seat count (Students) is required."),
  subscriptionModules: yup.array().of(yup.string().required()).default([]),
  subscriptionTrial: yup.boolean().default(true),
  subscriptionBillingCycle: yup
    .mixed<"QUARTERLY" | "SEMIANNUAL" | "ANNUAL">()
    .oneOf(["QUARTERLY", "SEMIANNUAL", "ANNUAL"])
    .nullable()
    .optional(),
  subscriptionStartDate: yup.string().required("Start date is required."),
  subscriptionRenewalDate: yup.string().required("Renewal date is required."),
})

export type hostelPayload = yup.InferType<typeof hostelSchema>
