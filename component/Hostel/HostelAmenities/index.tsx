"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Select from "react-select"
import { Checkbox } from "flowbite-react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import Button from "@/component/Common/Button/Button"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import Modal from "@/component/Common/Modal/Modal"
import { AppNavbar } from "@/component/Navbar"
import { useReactSelectStyles } from "@/component/Common/Select/useReactSelectStyles"
import { useHostel } from "@/component/Hostel/HostelProvider"
import { ROOM_AMENITY_CATALOG } from "@/lib/hostel/constants"
import type { HostelRoom } from "@/lib/hostel/types"

type Option = { label: string; value: string }

const MAX_VISIBLE = 3

const HostelAmenities = () => {
  const router = useRouter()
  const selectStyles = useReactSelectStyles({ compact: true, minHeight: 34, fontSize: "13px" })
  const { currentHostel, updateRoomAmenities } = useHostel()

  const [wing, setWing] = useState<Option | null>(null)
  const [building, setBuilding] = useState<Option | null>(null)
  const [floor, setFloor] = useState<Option | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<HostelRoom | null>(null)
  const [checklist, setChecklist] = useState<Array<{ _id: string; name: string; checked: boolean }>>(
    []
  )

  useEffect(() => {
    if (!currentHostel) router.push("/hostel/")
  }, [currentHostel, router])

  const wingOptions = useMemo(
    () => (currentHostel?.wings ?? []).map((w) => ({ label: w.name, value: w.id })),
    [currentHostel]
  )

  const selectedWing = currentHostel?.wings.find((w) => w.id === wing?.value)
  const buildingOptions = (selectedWing?.buildings ?? []).map((b) => ({
    label: b.name,
    value: b.id,
  }))
  const selectedBuilding = selectedWing?.buildings.find((b) => b.id === building?.value)
  const floorOptions = (selectedBuilding?.floors ?? []).map((f) => ({
    label: f.name,
    value: f.id,
  }))
  const selectedFloor = selectedBuilding?.floors.find((f) => f.id === floor?.value)
  const rooms = selectedFloor?.rooms ?? []

  const openEdit = (room: HostelRoom) => {
    setEditingRoom(room)
    setChecklist(
      ROOM_AMENITY_CATALOG.map((item) => ({
        ...item,
        checked: room.amenities.some((a) => a._id === item._id || a.name === item.name),
      }))
    )
    setEditOpen(true)
  }

  const saveRoom = () => {
    if (!currentHostel || !editingRoom) return
    updateRoomAmenities(
      currentHostel._id,
      editingRoom.id,
      checklist.filter((c) => c.checked).map((c) => c._id)
    )
    setEditOpen(false)
    setEditingRoom(null)
  }

  return (
    <LayoutWrapper
      navbar={
        <AppNavbar
          back
          title="Hostel Amenities"
          subtitle={currentHostel?.name ?? ""}
          onBack={() => router.push("/hostel/add-hostel/")}
        />
      }
    >
      <Modal open={editOpen} setOpen={setEditOpen} closeOnOutsideClick={false} width="md" height="2xl">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 text-start">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-md font-bold text-(--yoco-text)">{editingRoom?.name}</p>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg p-1 text-(--yoco-text-muted) hover:bg-(--yoco-row-hover)"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 cursor-pointer" />
            </button>
          </div>
          <div className="relative h-70 overflow-auto rounded-xl bg-(--yoco-surface) p-2">
            {checklist.map((item) => (
              <div
                key={item._id}
                className={`mt-2 rounded-lg border px-4 py-3 text-[12px] font-medium ${
                  item.checked
                    ? "border-[#674D9F]/35 bg-[#674D9F]/10 text-(--yoco-text)"
                    : "border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) text-(--yoco-text-muted)"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={item.checked ? "font-semibold text-[#674D9F]" : ""}>{item.name}</p>
                  <Checkbox
                    checked={item.checked}
                    onChange={(e) =>
                      setChecklist((prev) =>
                        prev.map((row) =>
                          row._id === item._id ? { ...row, checked: e.target.checked } : row
                        )
                      )
                    }
                    className="cursor-pointer rounded accent-[#674D9F]"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button title="Cancel" variant="secondary" onClick={() => setEditOpen(false)} />
            <Button title="Save" onClick={saveRoom} />
          </div>
        </div>
      </Modal>

      <div className="flex h-full min-h-0 flex-col bg-(--yoco-page-bg)">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) shadow-sm">
          <div className="flex shrink-0 flex-col gap-4 border-b border-(--yoco-border-subtle) bg-(--yoco-surface) px-4 py-4 sm:px-6">
            <div className="mx-auto grid w-full max-w-lg grid-cols-3 gap-2">
              <Select
                isClearable
                value={wing}
                options={wingOptions}
                onChange={(v) => {
                  setWing(v)
                  setBuilding(null)
                  setFloor(null)
                }}
                placeholder="Select Wing"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={selectStyles}
              />
              <Select
                isClearable
                value={building}
                isDisabled={!wing}
                options={buildingOptions}
                onChange={(v) => {
                  setBuilding(v)
                  setFloor(null)
                }}
                placeholder="Select Building"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={selectStyles}
              />
              <Select
                isClearable
                value={floor}
                isDisabled={!building}
                options={floorOptions}
                onChange={setFloor}
                placeholder="Select Floor"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={selectStyles}
              />
            </div>
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-(--yoco-page-bg) p-5">
            {rooms.length > 0 && (
              <p className="mb-4 text-sm font-semibold text-(--yoco-text-muted)">
                {rooms.length} room{rooms.length !== 1 ? "s" : ""} on this floor
              </p>
            )}
            <div className="grid auto-rows-fr grid-cols-3 items-stretch gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
              {rooms.length ? (
                rooms.map((room) => {
                  const amenities = room.amenities
                  const visible = amenities.slice(0, MAX_VISIBLE)
                  const hidden = amenities.length - visible.length
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => openEdit(room)}
                      className="group flex h-full min-h-30 cursor-pointer flex-col overflow-hidden rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) text-left shadow-sm transition-all hover:border-[#674D9F]/40 hover:shadow-md"
                    >
                      <div className="flex shrink-0 items-center gap-2 border-b border-[#674D9F]/15 bg-[#674D9F]/10 px-4 py-2.5">
                        <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#674D9F]">
                          {room.name}
                        </p>
                        <span className="shrink-0 rounded-full bg-[#674D9F] px-2 py-0.5 text-[10px] font-semibold text-white">
                          {amenities.length}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col justify-center px-4 py-3">
                        {amenities.length ? (
                          <div className="flex max-h-18 flex-wrap content-start gap-1.5 overflow-hidden">
                            {visible.map((item) => (
                              <span
                                key={item._id}
                                className="inline-flex max-w-full truncate rounded-md border border-[#674D9F]/30 bg-[#674D9F]/15 px-2 py-0.5 text-[11px] font-semibold text-[#674D9F]"
                              >
                                {item.name}
                              </span>
                            ))}
                            {hidden > 0 && (
                              <span className="inline-flex rounded-md border border-dashed border-[#674D9F]/40 px-2 py-0.5 text-[11px] font-semibold text-[#674D9F]">
                                +{hidden} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-(--yoco-text-muted)">
                            No amenities assigned
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="col-span-full flex h-80 items-center justify-center rounded-xl border border-dashed border-(--yoco-border-subtle) bg-(--yoco-surface-elevated)">
                  <p className="text-sm font-semibold text-(--yoco-text-muted)">
                    {floor
                      ? "No rooms found on this floor"
                      : "Select wing, building & floor to view rooms"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default HostelAmenities
