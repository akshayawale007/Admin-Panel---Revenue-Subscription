import {
  AMENITY_CATALOG,
  COUNTRIES,
  CITIES_BY_STATE,
  COLLEGES_BY_UNIVERSITY,
  DEFAULT_ROLES_SEED,
  defaultMobilePermissions,
  defaultWebPermissions,
  STATES_BY_COUNTRY,
  UNIVERSITIES,
} from "./constants"
import type {
  HostelBed,
  HostelFloor,
  HostelRecord,
  HostelRole,
  HostelRoom,
  HostelWing,
  SelectOption,
} from "./types"

function cloneRoles(): HostelRole[] {
  return DEFAULT_ROLES_SEED.map((role) => ({
    ...role,
    web: defaultWebPermissions().map((r) => ({ ...r, _id: `${role._id}-${r._id}` })),
    mobile: defaultMobilePermissions().map((r) => ({ ...r, _id: `${role._id}-${r._id}` })),
  }))
}

function beds(roomId: string, count: number): HostelBed[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${roomId}-b${i + 1}`,
    name: `B${i + 1}`,
    status: i === 0 ? "OCCUPIED" : "EMPTY",
  }))
}

function room(id: string, name: string, amenityIds: string[], bedCount: number): HostelRoom {
  return {
    id,
    name,
    amenities: AMENITY_CATALOG.filter((a) => amenityIds.includes(a._id)),
    beds: beds(id, bedCount),
  }
}

function floor(id: string, name: string, rooms: HostelRoom[]): HostelFloor {
  return { id, name, rooms }
}

function makeWings(prefix: string, mapped: boolean): HostelWing[] {
  if (!mapped) return []
  return [
    {
      id: `${prefix}-w1`,
      name: "Wing A",
      buildings: [
        {
          id: `${prefix}-b1`,
          name: "Building 1",
          floors: [
            floor(`${prefix}-f0`, "Floor 0", [
              room(`${prefix}-r1`, "Room 101", ["am-wifi", "am-washroom"], 3),
              room(`${prefix}-r2`, "Room 102", ["am-wifi", "am-ac"], 2),
            ]),
            floor(`${prefix}-f1`, "Floor 1", [
              room(`${prefix}-r3`, "Room 201", ["am-balcony", "am-wifi"], 4),
              room(`${prefix}-r4`, "Room 202", ["am-common-wash"], 3),
            ]),
          ],
        },
      ],
    },
    {
      id: `${prefix}-w2`,
      name: "Wing B",
      buildings: [
        {
          id: `${prefix}-b2`,
          name: "Building 1",
          floors: [
            floor(`${prefix}-f2`, "Floor 0", [
              room(`${prefix}-r5`, "Room 301", ["am-tv", "am-wifi"], 2),
            ]),
          ],
        },
      ],
    },
  ]
}

function geo(cityValue: string, stateValue: string) {
  const country = COUNTRIES[0]
  const state = STATES_BY_COUNTRY.in.find((s) => s.value === stateValue)!
  const city = CITIES_BY_STATE[stateValue].find((c) => c.value === cityValue)!
  return { country, state, city }
}

function amenityPick(ids: string[]) {
  return AMENITY_CATALOG.filter((a) => ids.includes(a._id))
}

type Seed = {
  _id: string
  hostelCode: string
  name: string
  hostelType: "Boys" | "Girls"
  studentPrifix: string
  ownerShipType: string
  description: string
  city: string
  state: string
  pincode: string
  address: string
  landmark: string
  universityId: string | null
  collegeId: string | null
  contact1: string
  contact2: string
  visitingHoursStart: string
  visitingHoursEnd: string
  messAvailable: boolean
  messDescription: string
  amenityIds: string[]
  securityAvailable: boolean
  status: boolean
  staffCount: number
  studentCount: number
  parentCount: number
  mapped: boolean
}

function toRecord(seed: Seed): HostelRecord {
  const loc = geo(seed.city, seed.state)
  const university = seed.universityId
    ? UNIVERSITIES.find((u) => u.value === seed.universityId) ?? null
    : null
  const college =
    seed.universityId && seed.collegeId
      ? (COLLEGES_BY_UNIVERSITY[seed.universityId] ?? []).find((c) => c.value === seed.collegeId) ??
        null
      : null

  return {
    _id: seed._id,
    hostelCode: seed.hostelCode,
    name: seed.name,
    hostelType: seed.hostelType,
    studentPrifix: seed.studentPrifix,
    ownerShipType: seed.ownerShipType,
    description: seed.description,
    country: loc.country,
    state: loc.state,
    city: loc.city,
    pincode: seed.pincode,
    address: seed.address,
    landmark: seed.landmark,
    universityId: university,
    collegeId: college,
    contact1: seed.contact1,
    contact2: seed.contact2,
    contact3: "",
    visitingHoursStart: seed.visitingHoursStart,
    visitingHoursEnd: seed.visitingHoursEnd,
    messAvailable: seed.messAvailable,
    messDescription: seed.messDescription,
    amenities: amenityPick(seed.amenityIds),
    securityAvailable: seed.securityAvailable,
    legalDocs: seed.mapped
      ? [{ id: `${seed._id}-doc1`, name: "registration.pdf", size: 240_000 }]
      : [],
    status: seed.status,
    staffCount: seed.staffCount,
    studentCount: seed.studentCount,
    parentCount: seed.parentCount,
    wings: makeWings(seed._id, seed.mapped),
    roles: cloneRoles(),
  }
}

const SEEDS: Seed[] = [
  {
    _id: "h1",
    hostelCode: "YS-PUN-001",
    name: "Sunrise Boys Hostel",
    hostelType: "Boys",
    studentPrifix: "SRB",
    ownerShipType: "Private",
    description: "Premium boys hostel near FC Road",
    city: "pune",
    state: "mh",
    pincode: "411004",
    address: "12 FC Road",
    landmark: "Near Fergusson College",
    universityId: "uni-sppu",
    collegeId: "col-ferg",
    contact1: "9876511101",
    contact2: "9876511102",
    visitingHoursStart: "16:00",
    visitingHoursEnd: "19:00",
    messAvailable: true,
    messDescription: "Veg + non-veg weekly rotation",
    amenityIds: ["am-wifi", "am-laundry", "am-cctv", "am-hotwater"],
    securityAvailable: true,
    status: true,
    staffCount: 14,
    studentCount: 180,
    parentCount: 162,
    mapped: true,
  },
  {
    _id: "h2",
    hostelCode: "YS-BLR-002",
    name: "Lakeview Girls",
    hostelType: "Girls",
    studentPrifix: "LVG",
    ownerShipType: "Private",
    description: "Girls hostel near Koramangala",
    city: "blr",
    state: "ka",
    pincode: "560034",
    address: "88 Intermediate Ring Road",
    landmark: "Opposite Forum Mall",
    universityId: "uni-bcu",
    collegeId: "col-christ",
    contact1: "9845012202",
    contact2: "",
    visitingHoursStart: "17:00",
    visitingHoursEnd: "20:00",
    messAvailable: true,
    messDescription: "South Indian + north Indian",
    amenityIds: ["am-wifi", "am-gym", "am-cctv"],
    securityAvailable: true,
    status: true,
    staffCount: 11,
    studentCount: 142,
    parentCount: 130,
    mapped: true,
  },
  {
    _id: "h3",
    hostelCode: "YS-MUM-003",
    name: "Riverbank Residency",
    hostelType: "Boys",
    studentPrifix: "RBR",
    ownerShipType: "Affiliated",
    description: "Andheri east student residence",
    city: "mumbai",
    state: "mh",
    pincode: "400069",
    address: "4 Chakala Road",
    landmark: "Near metro",
    universityId: "uni-mu",
    collegeId: "col-kjs",
    contact1: "9820013303",
    contact2: "9820013304",
    visitingHoursStart: "15:00",
    visitingHoursEnd: "18:30",
    messAvailable: true,
    messDescription: "Mess on all weekdays",
    amenityIds: ["am-wifi", "am-power", "am-laundry"],
    securityAvailable: true,
    status: true,
    staffCount: 9,
    studentCount: 96,
    parentCount: 88,
    mapped: true,
  },
  {
    _id: "h4",
    hostelCode: "YS-HYD-004",
    name: "Charminar Scholars Inn",
    hostelType: "Boys",
    studentPrifix: "CSI",
    ownerShipType: "Private",
    description: "Hyderabad old city hostel",
    city: "hyd",
    state: "ts",
    pincode: "500002",
    address: "21 Pathergatti",
    landmark: "Near Charminar",
    universityId: "uni-ou",
    collegeId: "col-nizam",
    contact1: "9000014404",
    contact2: "",
    visitingHoursStart: "16:30",
    visitingHoursEnd: "19:30",
    messAvailable: false,
    messDescription: "",
    amenityIds: ["am-wifi", "am-cctv"],
    securityAvailable: true,
    status: true,
    staffCount: 6,
    studentCount: 64,
    parentCount: 58,
    mapped: false,
  },
  {
    _id: "h5",
    hostelCode: "YS-DEL-005",
    name: "North Campus Girls Stay",
    hostelType: "Girls",
    studentPrifix: "NCG",
    ownerShipType: "Affiliated",
    description: "Walking distance to North Campus",
    city: "ndel",
    state: "dl",
    pincode: "110007",
    address: "9 Mall Road",
    landmark: "Near Vishwavidyalaya metro",
    universityId: "uni-du",
    collegeId: "col-hindu",
    contact1: "9810015505",
    contact2: "9810015506",
    visitingHoursStart: "16:00",
    visitingHoursEnd: "18:00",
    messAvailable: true,
    messDescription: "Home-style meals",
    amenityIds: ["am-wifi", "am-hotwater", "am-cctv", "am-laundry"],
    securityAvailable: true,
    status: true,
    staffCount: 10,
    studentCount: 110,
    parentCount: 104,
    mapped: false,
  },
  {
    _id: "h6",
    hostelCode: "YS-CHN-006",
    name: "Marina View Hostel",
    hostelType: "Boys",
    studentPrifix: "MVH",
    ownerShipType: "Private",
    description: "Guindy student housing",
    city: "chn",
    state: "tn",
    pincode: "600025",
    address: "15 Sardar Patel Road",
    landmark: "Near Guindy",
    universityId: "uni-anna",
    collegeId: "col-ceg",
    contact1: "9884016606",
    contact2: "",
    visitingHoursStart: "17:00",
    visitingHoursEnd: "20:00",
    messAvailable: true,
    messDescription: "Tamil + north Indian",
    amenityIds: ["am-wifi", "am-gym", "am-power"],
    securityAvailable: false,
    status: true,
    staffCount: 8,
    studentCount: 78,
    parentCount: 70,
    mapped: false,
  },
  {
    _id: "h7",
    hostelCode: "YS-NGP-007",
    name: "Mayur Luxury Hostel",
    hostelType: "Boys",
    studentPrifix: "MLH",
    ownerShipType: "Private",
    description: "Nagpur luxury stay",
    city: "nagpur",
    state: "mh",
    pincode: "440001",
    address: "44 Sitabuldi",
    landmark: "Near railway station",
    universityId: null,
    collegeId: null,
    contact1: "9822017707",
    contact2: "",
    visitingHoursStart: "16:00",
    visitingHoursEnd: "19:00",
    messAvailable: true,
    messDescription: "Buffet mess",
    amenityIds: ["am-wifi", "am-ac", "am-gym"],
    securityAvailable: true,
    status: false,
    staffCount: 5,
    studentCount: 40,
    parentCount: 36,
    mapped: false,
  },
  {
    _id: "h8",
    hostelCode: "YS-PUN-008",
    name: "Yoco Palm Residency",
    hostelType: "Girls",
    studentPrifix: "YPR",
    ownerShipType: "Private",
    description: "Kothrud girls residence",
    city: "pune",
    state: "mh",
    pincode: "411038",
    address: "7 Paud Road",
    landmark: "Near Karve Nagar",
    universityId: "uni-sppu",
    collegeId: "col-coep",
    contact1: "9764018808",
    contact2: "9764018809",
    visitingHoursStart: "16:00",
    visitingHoursEnd: "19:30",
    messAvailable: true,
    messDescription: "Jain + veg options",
    amenityIds: ["am-wifi", "am-laundry", "am-hotwater"],
    securityAvailable: true,
    status: true,
    staffCount: 12,
    studentCount: 128,
    parentCount: 120,
    mapped: false,
  },
  {
    _id: "h9",
    hostelCode: "YS-MYS-009",
    name: "Chamundi Girls Nest",
    hostelType: "Girls",
    studentPrifix: "CGN",
    ownerShipType: "Affiliated",
    description: "Mysuru campus housing",
    city: "mys",
    state: "ka",
    pincode: "570001",
    address: "3 Sayyaji Rao Road",
    landmark: "Near palace",
    universityId: "uni-bcu",
    collegeId: "col-mcc",
    contact1: "9845019909",
    contact2: "",
    visitingHoursStart: "15:30",
    visitingHoursEnd: "18:30",
    messAvailable: false,
    messDescription: "",
    amenityIds: ["am-wifi", "am-cctv"],
    securityAvailable: true,
    status: false,
    staffCount: 4,
    studentCount: 22,
    parentCount: 20,
    mapped: false,
  },
  {
    _id: "h10",
    hostelCode: "YS-MUM-010",
    name: "Scholars Hub",
    hostelType: "Boys",
    studentPrifix: "SHB",
    ownerShipType: "Private",
    description: "Dadar student hub",
    city: "mumbai",
    state: "mh",
    pincode: "400014",
    address: "18 Tilak Bridge",
    landmark: "Near Dadar station",
    universityId: "uni-mu",
    collegeId: "col-sxc",
    contact1: "9820020010",
    contact2: "",
    visitingHoursStart: "16:00",
    visitingHoursEnd: "19:00",
    messAvailable: true,
    messDescription: "Tiffin + weekend specials",
    amenityIds: ["am-wifi", "am-laundry", "am-power", "am-cctv"],
    securityAvailable: true,
    status: true,
    staffCount: 7,
    studentCount: 88,
    parentCount: 80,
    mapped: false,
  },
]

export const INITIAL_HOSTELS: HostelRecord[] = SEEDS.map(toRecord)

export function emptyWings(): HostelWing[] {
  return []
}

export function newHostelId(existing: HostelRecord[]): string {
  return `h-${Date.now()}`
}

export function option(label: string, value: string): SelectOption {
  return { label, value, name: label }
}
