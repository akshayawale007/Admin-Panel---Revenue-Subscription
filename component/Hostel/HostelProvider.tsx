"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "react-toastify"
import { AMENITY_CATALOG, defaultMobilePermissions, defaultWebPermissions, DEFAULT_ROLES_SEED } from "@/lib/hostel/constants"
import { INITIAL_HOSTELS, newHostelId } from "@/lib/hostel/mockData"
import type {
  HostelFormValues,
  HostelRecord,
  HostelRole,
  HostelWing,
  LegalDoc,
  PermissionRow,
  RoomCounts,
} from "@/lib/hostel/types"

const toastOpts = { autoClose: 2000 } as const

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function countRooms(wings: HostelWing[]): RoomCounts {
  let buildingCount = 0
  let floorCount = 0
  let roomCount = 0
  let bedCount = 0
  for (const wing of wings) {
    buildingCount += wing.buildings.length
    for (const building of wing.buildings) {
      floorCount += building.floors.length
      for (const floor of building.floors) {
        roomCount += floor.rooms.length
        for (const room of floor.rooms) bedCount += room.beds.length
      }
    }
  }
  return {
    wingCount: wings.length,
    buildingCount,
    floorCount,
    roomCount,
    bedCount,
  }
}

function formToRecord(values: HostelFormValues, existing?: HostelRecord): HostelRecord {
  const amenityIds = (values.ammenities ?? []).map((a) => a.value)
  const amenities = AMENITY_CATALOG.filter((a) => amenityIds.includes(a._id)).map((a) => ({
    _id: a._id,
    name: a.name,
  }))

  const messYes = String(values.availability?.value ?? "").toLowerCase() === "yes"
  const securityYes = String(values.security_availability?.value ?? "").toLowerCase() === "yes"

  return {
    _id: existing?._id ?? values._id ?? newHostelId([]),
    hostelCode: values.hostelCode,
    name: values.hostelName,
    hostelType: (values.hostelType?.value as "Boys" | "Girls") || "Boys",
    studentPrifix: values.studentPrifix,
    ownerShipType: values.ownerShipType?.label ?? "Private",
    description: values.description ?? "",
    country: {
      label: values.country?.label ?? "",
      value: values.country?.value ?? "",
      name: values.country?.name ?? values.country?.label ?? "",
    },
    state: {
      label: values.state?.label ?? "",
      value: values.state?.value ?? "",
      name: values.state?.name ?? values.state?.label ?? "",
    },
    city: {
      label: values.city?.label ?? "",
      value: values.city?.value ?? "",
      name: values.city?.name ?? values.city?.label ?? "",
    },
    pincode: values.pincode,
    address: values.address,
    landmark: values.landmark ?? "",
    universityId: values.universityId ?? null,
    collegeId: values.collegeId ?? null,
    contact1: values.contact1,
    contact2: values.contact2 ?? "",
    contact3: values.contact3 ?? "",
    visitingHoursStart: values.visitingHoursStart ?? "",
    visitingHoursEnd: values.visitingHoursEnd ?? "",
    messAvailable: messYes,
    messDescription: values.mess_description ?? "",
    amenities,
    securityAvailable: securityYes,
    legalDocs: existing?.legalDocs ?? [],
    status: existing?.status ?? true,
    staffCount: Number(values.staffCount ?? existing?.staffCount ?? 0) || 0,
    studentCount: Number(values.subscriptionStudentCount ?? existing?.studentCount ?? 0) || 0,
    parentCount: existing?.parentCount ?? 0,
    wings: existing?.wings ?? [],
    roles:
      existing?.roles ??
      DEFAULT_ROLES_SEED.map((role) => ({
        ...role,
        web: defaultWebPermissions().map((r) => ({ ...r, _id: `${role._id}-${r._id}` })),
        mobile: defaultMobilePermissions().map((r) => ({ ...r, _id: `${role._id}-${r._id}` })),
      })),
  }
}

type HostelContextValue = {
  hostels: HostelRecord[]
  currentHostelId: string | null
  currentRoleId: string | null
  draftDocs: LegalDoc[]
  setDraftDocs: (docs: LegalDoc[] | ((prev: LegalDoc[]) => LegalDoc[])) => void
  getHostel: (id: string) => HostelRecord | undefined
  currentHostel: HostelRecord | undefined
  currentRole: HostelRole | undefined
  selectHostel: (id: string | null) => void
  selectRole: (id: string | null) => void
  saveHostel: (values: HostelFormValues) => HostelRecord
  toggleStatus: (id: string, status: boolean) => void
  saveWings: (hostelId: string, wings: HostelWing[]) => void
  updateRoomAmenities: (
    hostelId: string,
    roomId: string,
    amenityIds: string[],
    roomName?: string
  ) => void
  saveRolePermissions: (hostelId: string, roleId: string, web: PermissionRow[], mobile: PermissionRow[]) => void
}

const HostelContext = createContext<HostelContextValue | null>(null)

export function HostelProvider({ children }: { children: ReactNode }) {
  const [hostels, setHostels] = useState<HostelRecord[]>(INITIAL_HOSTELS)
  const [currentHostelId, setCurrentHostelId] = useState<string | null>(null)
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null)
  const [draftDocs, setDraftDocs] = useState<LegalDoc[]>([])

  const getHostel = useCallback(
    (id: string) => hostels.find((h) => h._id === id),
    [hostels]
  )

  const currentHostel = useMemo(
    () => (currentHostelId ? hostels.find((h) => h._id === currentHostelId) : undefined),
    [hostels, currentHostelId]
  )

  const currentRole = useMemo(
    () => currentHostel?.roles.find((r) => r._id === currentRoleId),
    [currentHostel, currentRoleId]
  )

  const selectHostel = useCallback((id: string | null) => {
    setCurrentHostelId(id)
    setCurrentRoleId(null)
    const found = id ? hostels.find((h) => h._id === id) : undefined
    setDraftDocs(found?.legalDocs ?? [])
  }, [hostels])

  const selectRole = useCallback((id: string | null) => {
    setCurrentRoleId(id)
  }, [])

  const saveHostel = useCallback(
    (values: HostelFormValues) => {
      const existing = values._id ? hostels.find((h) => h._id === values._id) : undefined
      const next = formToRecord(values, existing)
      next.legalDocs = draftDocs
      if (!existing) next._id = uid("h")

      setHostels((prev) => {
        const idx = prev.findIndex((h) => h._id === next._id)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = next
          return copy
        }
        return [next, ...prev]
      })
      setCurrentHostelId(next._id)
      toast.success(existing ? "Hostel updated" : "Hostel created", toastOpts)
      return next
    },
    [hostels, draftDocs]
  )

  const toggleStatus = useCallback((id: string, status: boolean) => {
    setHostels((prev) => prev.map((h) => (h._id === id ? { ...h, status } : h)))
    toast.success(status ? "Hostel activated" : "Hostel deactivated", toastOpts)
  }, [])

  const saveWings = useCallback((hostelId: string, wings: HostelWing[]) => {
    setHostels((prev) => prev.map((h) => (h._id === hostelId ? { ...h, wings } : h)))
    toast.success("Room mapping saved", toastOpts)
  }, [])

  const updateRoomAmenities = useCallback(
    (hostelId: string, roomId: string, amenityIds: string[], roomName?: string) => {
      const amenities = AMENITY_CATALOG.filter((a) => amenityIds.includes(a._id)).map((a) => ({
        _id: a._id,
        name: a.name,
      }))
      setHostels((prev) =>
        prev.map((h) => {
          if (h._id !== hostelId) return h
          return {
            ...h,
            wings: h.wings.map((w) => ({
              ...w,
              buildings: w.buildings.map((b) => ({
                ...b,
                floors: b.floors.map((f) => ({
                  ...f,
                  rooms: f.rooms.map((r) =>
                    r.id === roomId
                      ? { ...r, amenities, name: roomName?.trim() ? roomName.trim() : r.name }
                      : r
                  ),
                })),
              })),
            })),
          }
        })
      )
      toast.success("Room amenities updated", toastOpts)
    },
    []
  )

  const saveRolePermissions = useCallback(
    (hostelId: string, roleId: string, web: PermissionRow[], mobile: PermissionRow[]) => {
      setHostels((prev) =>
        prev.map((h) => {
          if (h._id !== hostelId) return h
          return {
            ...h,
            roles: h.roles.map((r) => (r._id === roleId ? { ...r, web, mobile } : r)),
          }
        })
      )
      toast.success("Custom permissions saved", toastOpts)
    },
    []
  )

  const value = useMemo<HostelContextValue>(
    () => ({
      hostels,
      currentHostelId,
      currentRoleId,
      draftDocs,
      setDraftDocs,
      getHostel,
      currentHostel,
      currentRole,
      selectHostel,
      selectRole,
      saveHostel,
      toggleStatus,
      saveWings,
      updateRoomAmenities,
      saveRolePermissions,
    }),
    [
      hostels,
      currentHostelId,
      currentRoleId,
      draftDocs,
      getHostel,
      currentHostel,
      currentRole,
      selectHostel,
      selectRole,
      saveHostel,
      toggleStatus,
      saveWings,
      updateRoomAmenities,
      saveRolePermissions,
    ]
  )

  return <HostelContext.Provider value={value}>{children}</HostelContext.Provider>
}

export function useHostel() {
  const ctx = useContext(HostelContext)
  if (!ctx) throw new Error("useHostel must be used within HostelProvider")
  return ctx
}
