export type SelectOption = {
  label: string
  value: string
  name?: string
}

export type LegalDoc = {
  id: string
  name: string
  size: number
  url?: string
}

export type HostelAmenityRef = {
  _id: string
  name: string
}

export type BedStatus = "EMPTY" | "OCCUPIED" | "RESERVED"

export type HostelBed = {
  id: string
  name: string
  status: BedStatus
}

export type HostelRoom = {
  id: string
  name: string
  amenities: HostelAmenityRef[]
  beds: HostelBed[]
}

export type HostelFloor = {
  id: string
  name: string
  rooms: HostelRoom[]
}

export type HostelBuilding = {
  id: string
  name: string
  floors: HostelFloor[]
}

export type HostelWing = {
  id: string
  name: string
  buildings: HostelBuilding[]
}

export type RoomCounts = {
  wingCount: number
  buildingCount: number
  floorCount: number
  roomCount: number
  bedCount: number
}

export type PermissionRow = {
  _id: string
  title: string
  platform: "web" | "mobile"
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

export type HostelRole = {
  _id: string
  uniqueId: string
  name: string
  categoryType: string
  web: PermissionRow[]
  mobile: PermissionRow[]
}

export type HostelRecord = {
  _id: string
  hostelCode: string
  name: string
  hostelType: "Boys" | "Girls"
  studentPrifix: string
  ownerShipType: string
  description: string
  country: SelectOption
  state: SelectOption
  city: SelectOption
  pincode: string
  address: string
  landmark: string
  universityId: SelectOption | null
  collegeId: SelectOption | null
  contact1: string
  contact2: string
  contact3: string
  visitingHoursStart: string
  visitingHoursEnd: string
  messAvailable: boolean
  messDescription: string
  amenities: HostelAmenityRef[]
  securityAvailable: boolean
  legalDocs: LegalDoc[]
  status: boolean
  staffCount: number
  studentCount: number
  parentCount: number
  wings: HostelWing[]
  roles: HostelRole[]
}

export type HostelFormValues = {
  _id?: string | null
  status?: boolean
  hostelName: string
  hostelType: SelectOption | null
  studentPrifix: string
  hostelCode: string
  ownerShipType: SelectOption | null
  description?: string | null
  country: SelectOption | null
  state: SelectOption | null
  city: SelectOption | null
  pincode: string
  address: string
  landmark?: string | null
  universityId?: SelectOption | null
  collegeId?: SelectOption | null
  contact1: string
  contact2?: string | null
  contact3?: string | null
  visitingHoursStart?: string | null
  visitingHoursEnd?: string | null
  availability?: SelectOption | null
  mess_description?: string | null
  security_availability?: SelectOption | null
  ammenities?: SelectOption[]
  staffCount?: number
  subscriptionPlan?: "PREMIUM" | "ADVANCED" | "ELITE" | "CUSTOM"
  subscriptionStudentCount?: number
  subscriptionModules?: string[]
  subscriptionStartDate?: string
  subscriptionRenewalDate?: string
  subscriptionTrial?: boolean
  subscriptionTrialDays?: number
  subscriptionBillingCycle?: "QUARTERLY" | "SEMIANNUAL" | "ANNUAL"
}
