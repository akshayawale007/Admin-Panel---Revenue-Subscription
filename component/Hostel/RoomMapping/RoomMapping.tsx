"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import { toast } from "react-toastify"
import Button from "@/component/Common/Button/Button"
import Input from "@/component/Common/Input/Input"
import Modal from "@/component/Common/Modal/Modal"
import LayoutWrapper from "@/component/Common/Layout/LayoutWrapper"
import { AppNavbar } from "@/component/Navbar"
import { countRooms, useHostel } from "@/component/Hostel/HostelProvider"
import type { HostelBed, HostelBuilding, HostelFloor, HostelRoom, HostelWing } from "@/lib/hostel/types"

type NodeType = "WING" | "BUILDING" | "FLOOR" | "ROOM"

const NODE_LABELS: Record<NodeType, { title: string; label: string; placeholder: string }> = {
  WING: { title: "Rename Wing", label: "Wing name", placeholder: "Wing name" },
  BUILDING: { title: "Rename Building", label: "Building name", placeholder: "Building name" },
  FLOOR: { title: "Rename Floor", label: "Floor name", placeholder: "Floor name" },
  ROOM: { title: "Rename Room", label: "Room name", placeholder: "Room name" },
}

function cloneWings(wings: HostelWing[]): HostelWing[] {
  return JSON.parse(JSON.stringify(wings)) as HostelWing[]
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function Chip({
  label,
  selected,
  onClick,
  onEdit,
  onDelete,
  canDelete,
}: {
  label: string
  selected: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
  canDelete?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const showMenu = Boolean(onEdit || canDelete)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen || !btnRef.current) {
      setCoords(null)
      return
    }
    const rect = btnRef.current.getBoundingClientRect()
    setCoords({ top: rect.bottom + 8, left: Math.max(8, rect.right - 100) })
  }, [menuOpen])

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-sm ${
        selected
          ? "border-[#674D9F] bg-[#674D9F]/15 text-[#674D9F]"
          : "border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) text-(--yoco-text)"
      }`}
    >
      <button type="button" onClick={onClick} className="min-w-0 flex-1 cursor-pointer truncate text-left">
        {label}
      </button>
      {showMenu && (
        <button
          ref={btnRef}
          type="button"
          className="cursor-pointer rounded p-0.5 hover:bg-(--yoco-row-hover)"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More"
        >
          <EllipsisVerticalIcon className="h-4 w-4" />
        </button>
      )}
      {showMenu && menuOpen && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: coords.top, left: coords.left }}
              className="fixed z-99999 min-w-25 rounded-md border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) py-1 shadow-lg"
            >
              {onEdit && (
                <button
                  type="button"
                  className="block w-full cursor-pointer px-3 py-2 text-left text-xs hover:bg-(--yoco-row-hover)"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit()
                  }}
                >
                  Rename
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  className="block w-full cursor-pointer px-3 py-2 text-left text-xs text-rose-500 hover:bg-(--yoco-row-hover)"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                >
                  Delete
                </button>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

const RoomMapping = () => {
  const router = useRouter()
  const { currentHostel, saveWings } = useHostel()
  const [rows, setRows] = useState<HostelWing[]>([])
  const [edit, setEdit] = useState(false)
  const [selectWing, setSelectWing] = useState<number | null>(null)
  const [selectBuilding, setSelectBuilding] = useState<number | null>(null)
  const [selectFloor, setSelectFloor] = useState<number | null>(null)
  const [selectRoom, setSelectRoom] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [nodeName, setNodeName] = useState("")
  const [editCtx, setEditCtx] = useState<{ type: NodeType; path: number[] } | null>(null)

  useEffect(() => {
    if (!currentHostel) {
      router.push("/hostel/")
      return
    }
    const next = cloneWings(currentHostel.wings)
    setRows(next)
    if (next.length) {
      setSelectWing(0)
      setSelectBuilding(next[0].buildings.length ? 0 : null)
      setSelectFloor(next[0].buildings[0]?.floors.length ? 0 : null)
      setSelectRoom(next[0].buildings[0]?.floors[0]?.rooms.length ? 0 : null)
    }
  }, [currentHostel, router])

  const counts = countRooms(rows)
  const buildings = selectWing !== null ? rows[selectWing]?.buildings ?? [] : []
  const floors =
    selectWing !== null && selectBuilding !== null
      ? rows[selectWing]?.buildings[selectBuilding]?.floors ?? []
      : []
  const rooms =
    selectWing !== null && selectBuilding !== null && selectFloor !== null
      ? rows[selectWing]?.buildings[selectBuilding]?.floors[selectFloor]?.rooms ?? []
      : []
  const beds =
    selectWing !== null && selectBuilding !== null && selectFloor !== null && selectRoom !== null
      ? rows[selectWing]?.buildings[selectBuilding]?.floors[selectFloor]?.rooms[selectRoom]?.beds ?? []
      : []

  const addBtnClass = `${
    edit ? "hover:bg-[#674D9FE5] hover:text-white" : "cursor-not-allowed opacity-50 pointer-events-none"
  } ml-2 cursor-pointer rounded-md px-3 py-1 text-sm font-medium text-[var(--yoco-primary-light)]`

  const openRename = (type: NodeType, path: number[], current: string) => {
    if (!edit) return
    setEditCtx({ type, path })
    setNodeName(current)
    setEditOpen(true)
  }

  const saveRename = () => {
    const trimmed = nodeName.trim()
    if (!trimmed || !editCtx) {
      toast.error("Name is required")
      return
    }
    setRows((prev) => {
      const next = cloneWings(prev)
      const [w, b, f, r] = editCtx.path
      if (editCtx.type === "WING") next[w].name = trimmed
      if (editCtx.type === "BUILDING") next[w].buildings[b].name = trimmed
      if (editCtx.type === "FLOOR") next[w].buildings[b].floors[f].name = trimmed
      if (editCtx.type === "ROOM") next[w].buildings[b].floors[f].rooms[r].name = trimmed
      return next
    })
    setEditOpen(false)
    toast.success("Renamed")
  }

  const handleAddWing = () => {
    const wingNum = rows.length + 1
    const newRoom: HostelRoom = {
      id: uid("r"),
      name: "Room 1",
      amenities: [],
      beds: [{ id: uid("bed"), name: "B1", status: "EMPTY" }],
    }
    const newWing: HostelWing = {
      id: uid("w"),
      name: `Wing ${wingNum}`,
      buildings: [
        {
          id: uid("b"),
          name: "Building 1",
          floors: [{ id: uid("f"), name: "Floor 0", rooms: [newRoom] }],
        },
      ],
    }
    setRows((prev) => [...prev, newWing])
    setSelectWing(rows.length)
    setSelectBuilding(0)
    setSelectFloor(0)
    setSelectRoom(0)
  }

  const handleAddBuilding = () => {
    if (selectWing === null) return
    setRows((prev) => {
      const next = cloneWings(prev)
      const newRoom: HostelRoom = {
        id: uid("r"),
        name: "Room 1",
        amenities: [],
        beds: [{ id: uid("bed"), name: "B1", status: "EMPTY" }],
      }
      const building: HostelBuilding = {
        id: uid("b"),
        name: `Building ${next[selectWing].buildings.length + 1}`,
        floors: [{ id: uid("f"), name: "Floor 0", rooms: [newRoom] }],
      }
      next[selectWing].buildings.push(building)
      setSelectBuilding(next[selectWing].buildings.length - 1)
      setSelectFloor(0)
      setSelectRoom(0)
      return next
    })
  }

  const handleAddFloor = () => {
    if (selectWing === null || selectBuilding === null) return
    setRows((prev) => {
      const next = cloneWings(prev)
      const floorsNow = next[selectWing].buildings[selectBuilding].floors
      const newRoom: HostelRoom = {
        id: uid("r"),
        name: "Room 1",
        amenities: [],
        beds: [{ id: uid("bed"), name: "B1", status: "EMPTY" }],
      }
      const floor: HostelFloor = { id: uid("f"), name: `Floor ${floorsNow.length}`, rooms: [newRoom] }
      floorsNow.push(floor)
      setSelectFloor(floorsNow.length - 1)
      setSelectRoom(0)
      return next
    })
  }

  const handleAddRoom = () => {
    if (selectWing === null || selectBuilding === null || selectFloor === null) return
    setRows((prev) => {
      const next = cloneWings(prev)
      const roomsNow = next[selectWing].buildings[selectBuilding].floors[selectFloor].rooms
      roomsNow.push({
        id: uid("r"),
        name: `Room ${roomsNow.length + 1}`,
        amenities: [],
        beds: [{ id: uid("bed"), name: "B1", status: "EMPTY" }],
      })
      setSelectRoom(roomsNow.length - 1)
      return next
    })
  }

  const handleAddBed = () => {
    if (selectWing === null || selectBuilding === null || selectFloor === null || selectRoom === null)
      return
    setRows((prev) => {
      const next = cloneWings(prev)
      const room = next[selectWing].buildings[selectBuilding].floors[selectFloor].rooms[selectRoom]
      const bed: HostelBed = { id: uid("bed"), name: `B${room.beds.length + 1}`, status: "EMPTY" }
      room.beds.push(bed)
      return next
    })
  }

  const handleRemoveWing = (i: number) => {
    if (rows[i].buildings.length) {
      toast.error("Remove all buildings before deleting this wing.")
      return
    }
    setRows((prev) => prev.filter((_, idx) => idx !== i))
    setSelectWing(null)
    setSelectBuilding(null)
    setSelectFloor(null)
    setSelectRoom(null)
  }

  const handleRemoveBuilding = (wi: number, bi: number) => {
    if (rows[wi].buildings[bi].floors.length) {
      toast.error("Remove all floors before deleting this building.")
      return
    }
    setRows((prev) => {
      const next = cloneWings(prev)
      next[wi].buildings.splice(bi, 1)
      return next
    })
    setSelectBuilding(0)
    setSelectFloor(0)
    setSelectRoom(0)
  }

  const handleRemoveFloor = (wi: number, bi: number, fi: number) => {
    setRows((prev) => {
      const next = cloneWings(prev)
      next[wi].buildings[bi].floors.splice(fi, 1)
      return next
    })
    setSelectFloor(0)
    setSelectRoom(0)
  }

  const handleRemoveRoom = (wi: number, bi: number, fi: number, ri: number) => {
    setRows((prev) => {
      const next = cloneWings(prev)
      next[wi].buildings[bi].floors[fi].rooms.splice(ri, 1)
      return next
    })
    setSelectRoom(0)
  }

  const columnClass = "flex w-1/5 flex-col min-h-0"
  const headerClass =
    "shrink-0 border-b border-[var(--yoco-border-subtle)] bg-[var(--yoco-surface)] px-4 py-3 flex items-center"
  const scrollClass = "flex flex-col gap-1 overflow-y-auto p-2 flex-1"

  return (
    <LayoutWrapper
      navbar={
        <AppNavbar
          back
          title="Room Mapping"
          subtitle={currentHostel?.name}
          onBack={() => router.push("/hostel/add-hostel/")}
        >
          <Button
            className="yoco-filter-chip yoco-filter-chip--default shadow-none!"
            title={!edit ? "Edit" : "Cancel"}
            onClick={() => {
              if (edit && currentHostel) setRows(cloneWings(currentHostel.wings))
              setEdit((v) => !v)
            }}
          />
          <Button
            className="text-white!"
            disabled={!edit}
            title="Done"
            onClick={() => {
              if (!currentHostel) return
              saveWings(currentHostel._id, rows)
              setEdit(false)
            }}
          />
        </AppNavbar>
      }
    >
      <Modal open={editOpen} setOpen={setEditOpen} width="md">
        <div className="mt-4 px-5 py-3 text-start">
          <p className="mb-4 text-center text-lg font-bold text-(--yoco-text)">
            {editCtx ? NODE_LABELS[editCtx.type].title : "Rename"}
          </p>
          <Input
            required
            label={editCtx ? NODE_LABELS[editCtx.type].label : "Name"}
            placeholder={editCtx ? NODE_LABELS[editCtx.type].placeholder : "Name"}
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
          />
          <div className="mt-6 flex justify-center gap-3">
            <Button title="Cancel" variant="secondary" onClick={() => setEditOpen(false)} />
            <Button title="Save" onClick={saveRename} />
          </div>
        </div>
      </Modal>

      <div className="flex flex-col bg-(--yoco-page-bg)" style={{ height: "calc(100vh - 120px)" }}>
        <div className="mx-2 my-2 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-sm text-(--yoco-text-muted)">
            Max Seat :{" "}
            <span className="font-semibold text-(--yoco-text)">
              {(currentHostel?.studentCount ?? 0) + (currentHostel?.staffCount ?? 0)}
            </span>{" "}
            (Students : <span className="font-semibold text-(--yoco-text)">{currentHostel?.studentCount ?? 0}</span>
            {" | "}
            Staff : <span className="font-semibold text-(--yoco-text)">{currentHostel?.staffCount ?? 0}</span>)
          </p>
          <div className="flex min-w-0 flex-1 flex-wrap justify-center gap-5">
            <p className="text-sm text-(--yoco-text-muted)">
              Total Wings : <span className="font-semibold text-(--yoco-text)">{counts.wingCount}</span>
            </p>
            <p className="text-sm text-(--yoco-text-muted)">
              Total Buildings :{" "}
              <span className="font-semibold text-(--yoco-text)">{counts.buildingCount}</span>
            </p>
            <p className="text-sm text-(--yoco-text-muted)">
              Total Floors : <span className="font-semibold text-(--yoco-text)">{counts.floorCount}</span>
            </p>
            <p className="text-sm text-(--yoco-text-muted)">
              Total Rooms : <span className="font-semibold text-(--yoco-text)">{counts.roomCount}</span>
            </p>
            <p className="text-sm text-(--yoco-text-muted)">
              Total Beds : <span className="font-semibold text-(--yoco-text)">{counts.bedCount}</span>
            </p>
          </div>
        </div>

        <div className="mx-2 flex min-h-0 flex-1 overflow-hidden rounded-xl border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated)">
          <div className={columnClass}>
            <div className={headerClass}>
              <span className="text-sm font-semibold">Wings</span>
              <button type="button" className={addBtnClass} onClick={handleAddWing} disabled={!edit}>
                + Add
              </button>
            </div>
            <div className={scrollClass}>
              {rows.map((wing, i) => (
                <Chip
                  key={wing.id}
                  label={wing.name}
                  selected={selectWing === i}
                  onClick={() => {
                    setSelectWing(i)
                    setSelectBuilding(wing.buildings.length ? 0 : null)
                    setSelectFloor(wing.buildings[0]?.floors.length ? 0 : null)
                    setSelectRoom(wing.buildings[0]?.floors[0]?.rooms.length ? 0 : null)
                  }}
                  onEdit={edit ? () => openRename("WING", [i], wing.name) : undefined}
                  canDelete={edit}
                  onDelete={() => handleRemoveWing(i)}
                />
              ))}
            </div>
          </div>

          <div className={`${columnClass} border-l border-(--yoco-border-subtle)`}>
            <div className={headerClass}>
              <span className="text-sm font-semibold">Buildings</span>
              <button
                type="button"
                className={addBtnClass}
                onClick={handleAddBuilding}
                disabled={!edit || selectWing === null}
              >
                + Add
              </button>
            </div>
            <div className={scrollClass}>
              {buildings.map((building, i) => (
                <Chip
                  key={building.id}
                  label={building.name}
                  selected={selectBuilding === i}
                  onClick={() => {
                    setSelectBuilding(i)
                    setSelectFloor(building.floors.length ? 0 : null)
                    setSelectRoom(building.floors[0]?.rooms.length ? 0 : null)
                  }}
                  onEdit={
                    edit && selectWing !== null
                      ? () => openRename("BUILDING", [selectWing, i], building.name)
                      : undefined
                  }
                  canDelete={edit}
                  onDelete={() => selectWing !== null && handleRemoveBuilding(selectWing, i)}
                />
              ))}
            </div>
          </div>

          <div className={`${columnClass} border-l border-(--yoco-border-subtle)`}>
            <div className={headerClass}>
              <span className="text-sm font-semibold">Floors</span>
              <button
                type="button"
                className={addBtnClass}
                onClick={handleAddFloor}
                disabled={!edit || selectBuilding === null}
              >
                + Add
              </button>
            </div>
            <div className={scrollClass}>
              {floors.map((floor, i) => (
                <Chip
                  key={floor.id}
                  label={floor.name}
                  selected={selectFloor === i}
                  onClick={() => {
                    setSelectFloor(i)
                    setSelectRoom(floor.rooms.length ? 0 : null)
                  }}
                  onEdit={
                    edit && selectWing !== null && selectBuilding !== null
                      ? () => openRename("FLOOR", [selectWing, selectBuilding, i], floor.name)
                      : undefined
                  }
                  canDelete={edit}
                  onDelete={() =>
                    selectWing !== null &&
                    selectBuilding !== null &&
                    handleRemoveFloor(selectWing, selectBuilding, i)
                  }
                />
              ))}
            </div>
          </div>

          <div className={`${columnClass} border-l border-(--yoco-border-subtle)`}>
            <div className={headerClass}>
              <span className="text-sm font-semibold">Rooms</span>
              <button
                type="button"
                className={addBtnClass}
                onClick={handleAddRoom}
                disabled={!edit || selectFloor === null}
              >
                + Add
              </button>
            </div>
            <div className={scrollClass}>
              {rooms.map((room, i) => (
                <Chip
                  key={room.id}
                  label={room.name}
                  selected={selectRoom === i}
                  onClick={() => setSelectRoom(i)}
                  onEdit={
                    edit && selectWing !== null && selectBuilding !== null && selectFloor !== null
                      ? () =>
                          openRename("ROOM", [selectWing, selectBuilding, selectFloor, i], room.name)
                      : undefined
                  }
                  canDelete={edit}
                  onDelete={() =>
                    selectWing !== null &&
                    selectBuilding !== null &&
                    selectFloor !== null &&
                    handleRemoveRoom(selectWing, selectBuilding, selectFloor, i)
                  }
                />
              ))}
            </div>
          </div>

          <div className={`${columnClass} border-l border-(--yoco-border-subtle)`}>
            <div className={headerClass}>
              <span className="text-sm font-semibold">Beds</span>
              <button
                type="button"
                className={addBtnClass}
                onClick={handleAddBed}
                disabled={!edit || selectRoom === null}
              >
                + Add
              </button>
            </div>
            <div className={scrollClass}>
              {beds.map((bed) => (
                <div
                  key={bed.id}
                  className="rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface) px-3 py-1.5 text-sm"
                >
                  {bed.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default RoomMapping
