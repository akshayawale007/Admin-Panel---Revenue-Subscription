import type { PermissionRow, SelectOption } from "./types"

export const HOSTEL_TYPE_OPTIONS: SelectOption[] = [
  { label: "Boys", value: "Boys" },
  { label: "Girls", value: "Girls" },
]

export const OWNERSHIP_OPTIONS: SelectOption[] = [
  { label: "Private", value: "1" },
  { label: "Affiliated", value: "2" },
]

export const YES_NO_OPTIONS: SelectOption[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
]

export const AMENITY_CATALOG: { _id: string; name: string }[] = [
  { _id: "am-wifi", name: "WiFi" },
  { _id: "am-ac", name: "Air Conditioner" },
  { _id: "am-laundry", name: "Laundry" },
  { _id: "am-gym", name: "Gym" },
  { _id: "am-hotwater", name: "Hot Water" },
  { _id: "am-cctv", name: "CCTV" },
  { _id: "am-power", name: "Power Backup" },
  { _id: "am-washroom", name: "Attached Washroom" },
  { _id: "am-common-wash", name: "Common Washroom" },
  { _id: "am-balcony", name: "Balcony" },
  { _id: "am-tv", name: "TV" },
  { _id: "am-bunker", name: "Bunker Bed" },
]

export const ROOM_AMENITY_CATALOG = AMENITY_CATALOG.filter((a) =>
  ["am-washroom", "am-common-wash", "am-balcony", "am-ac", "am-tv", "am-bunker", "am-wifi"].includes(
    a._id
  )
)

export const COUNTRIES: SelectOption[] = [
  { label: "India", value: "in", name: "India" },
]

export const STATES_BY_COUNTRY: Record<string, SelectOption[]> = {
  in: [
    { label: "Maharashtra", value: "mh", name: "Maharashtra" },
    { label: "Karnataka", value: "ka", name: "Karnataka" },
    { label: "Telangana", value: "ts", name: "Telangana" },
    { label: "Delhi", value: "dl", name: "Delhi" },
    { label: "Tamil Nadu", value: "tn", name: "Tamil Nadu" },
  ],
}

export const CITIES_BY_STATE: Record<string, SelectOption[]> = {
  mh: [
    { label: "Pune", value: "pune", name: "Pune" },
    { label: "Mumbai", value: "mumbai", name: "Mumbai" },
    { label: "Nagpur", value: "nagpur", name: "Nagpur" },
  ],
  ka: [
    { label: "Bengaluru", value: "blr", name: "Bengaluru" },
    { label: "Mysuru", value: "mys", name: "Mysuru" },
  ],
  ts: [{ label: "Hyderabad", value: "hyd", name: "Hyderabad" }],
  dl: [{ label: "New Delhi", value: "ndel", name: "New Delhi" }],
  tn: [{ label: "Chennai", value: "chn", name: "Chennai" }],
}

export const UNIVERSITIES: SelectOption[] = [
  { label: "Savitribai Phule Pune University", value: "uni-sppu" },
  { label: "University of Mumbai", value: "uni-mu" },
  { label: "Bengaluru City University", value: "uni-bcu" },
  { label: "Osmania University", value: "uni-ou" },
  { label: "University of Delhi", value: "uni-du" },
  { label: "Anna University", value: "uni-anna" },
]

export const COLLEGES_BY_UNIVERSITY: Record<string, SelectOption[]> = {
  "uni-sppu": [
    { label: "Fergusson College", value: "col-ferg" },
    { label: "COEP Technological University", value: "col-coep" },
  ],
  "uni-mu": [
    { label: "St. Xavier's College", value: "col-sxc" },
    { label: "KJ Somaiya College", value: "col-kjs" },
  ],
  "uni-bcu": [
    { label: "Christ University", value: "col-christ" },
    { label: "Mount Carmel College", value: "col-mcc" },
  ],
  "uni-ou": [{ label: "Nizam College", value: "col-nizam" }],
  "uni-du": [{ label: "Hindu College", value: "col-hindu" }],
  "uni-anna": [{ label: "College of Engineering Guindy", value: "col-ceg" }],
}

const webTitles = [
  "Dashboard",
  "Students",
  "Attendance",
  "Leave",
  "Mess",
  "Complaints",
  "Visitors",
  "Room Allocation",
  "Fee",
  "Notices",
]

const mobileTitles = ["Home", "Attendance", "Leave", "Mess", "Complaints", "Visitors", "Profile"]

function rows(titles: string[], platform: "web" | "mobile", prefix: string): PermissionRow[] {
  return titles.map((title, i) => ({
    _id: `${prefix}-${i + 1}`,
    title,
    platform,
    view: true,
    edit: platform === "web" && i < 4,
    add: platform === "web" && i < 3,
    delete: false,
  }))
}

export function defaultWebPermissions(): PermissionRow[] {
  return rows(webTitles, "web", "web")
}

export function defaultMobilePermissions(): PermissionRow[] {
  return rows(mobileTitles, "mobile", "mob")
}

export const DEFAULT_ROLES_SEED: Array<Omit<import("./types").HostelRole, "web" | "mobile">> = [
  { _id: "role-warden", uniqueId: "R-001", name: "Warden", categoryType: "Staff" },
  { _id: "role-caretaker", uniqueId: "R-002", name: "Caretaker", categoryType: "Staff" },
  { _id: "role-student", uniqueId: "R-003", name: "Student", categoryType: "Student" },
  { _id: "role-parent", uniqueId: "R-004", name: "Parent", categoryType: "Parent" },
]
