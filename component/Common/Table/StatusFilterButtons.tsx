"use client"

export type StatusFilterValue = "all" | "active" | "inactive" | "left"

type StatusFilterButtonsProps = {
  selected: StatusFilterValue
  onSelect: (value: StatusFilterValue) => void
  disabled?: boolean
  showLeft?: boolean
  showActive?: boolean
  showInActive?: boolean
  showAll?: boolean
}

export default function StatusFilterButtons({
  selected,
  onSelect,
  disabled = false,
  showLeft = false,
  showAll = false,
  showActive = false,
  showInActive = false,
}: StatusFilterButtonsProps) {
  const chipClass = (value: StatusFilterValue) =>
    `yoco-filter-chip ${
      selected === value ? "yoco-filter-chip--selected" : "yoco-filter-chip--default"
    }`

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {showAll && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect("all")}
          className={chipClass("all")}
        >
          All
        </button>
      )}

      {showActive && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect("active")}
          className={chipClass("active")}
        >
          <span className="flex items-center gap-2">
            Active
            <span className="h-2 w-2 rounded-full bg-green-400" />
          </span>
        </button>
      )}

      {showInActive && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect("inactive")}
          className={chipClass("inactive")}
        >
          <span className="flex items-center gap-2">
            Inactive
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
          </span>
        </button>
      )}

      {showLeft ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect("left")}
          className={chipClass("left")}
        >
          <span className="flex items-center gap-2">
            Left
            <span className="h-2 w-2 rounded-full bg-[#d32f2f]" />
          </span>
        </button>
      ) : null}
    </div>
  )
}
