"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import debounce from "lodash/debounce"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"

type DebounceAsyncSearchProps = {
  onSearch: (value: string) => void
  debounceTimeout?: number
  placeholder?: string
}

const DebounceAsyncSearch = ({
  onSearch,
  debounceTimeout = 500,
  placeholder = "Search...",
}: DebounceAsyncSearchProps) => {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        onSearch(value)
      }, debounceTimeout),
    [onSearch, debounceTimeout]
  )

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const collapseIfEmpty = () => {
    if (!inputValue.trim()) setOpen(false)
  }

  const clearSearch = () => {
    setInputValue("")
    debouncedSearch("")
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label={placeholder}
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-(--yoco-input-border) bg-(--yoco-input-bg) text-(--yoco-text) transition-colors hover:bg-(--yoco-row-hover)"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div className="relative w-56 shrink-0">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-(--yoco-text-muted)" />
      <input
        ref={inputRef}
        type="search"
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => {
          const value = e.target.value
          setInputValue(value)
          debouncedSearch(value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (inputValue) clearSearch()
            else setOpen(false)
          }
        }}
        onBlur={collapseIfEmpty}
        className="h-9 w-full rounded-lg border border-(--yoco-input-border) bg-(--yoco-input-bg) py-1.5 pr-8 pl-8 text-sm text-(--yoco-text) outline-none placeholder:text-(--yoco-text-muted) focus:border-(--yoco-primary)"
      />
      <button
        type="button"
        aria-label="Close search"
        onMouseDown={(e) => e.preventDefault()}
        onClick={clearSearch}
        className="absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-(--yoco-text-muted) hover:bg-(--yoco-row-hover) hover:text-(--yoco-text)"
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default DebounceAsyncSearch
