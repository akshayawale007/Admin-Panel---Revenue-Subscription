"use client"

import React, { useState, useEffect, useMemo } from "react"
import Select, { components } from "react-select"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { useTheme } from "@/component/Common/Theme/ThemeProvider"
import { getReactSelectStyles } from "@/component/Common/Select/reactSelectTheme"

export type OptionType = {
  label: string
  value: string
}

type Props = {
  options: (OptionType | null)[]
  onSearch: (input: string) => void
  onChange?: (option: OptionType | OptionType[] | null) => void
  placeholder?: string
  isLoading?: boolean
  register?: any
  name?: string
  setValue?: any
  watch?: any
  disabled?: boolean
  isMulti?: boolean
}

const DebounceSelect: React.FC<Props> = ({
  disabled = false,
  options,
  onSearch,
  onChange,
  placeholder = "Search...",
  isLoading = false,
  register,
  setValue,
  name,
  isMulti,
  watch = () => {},
}) => {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [lastValue, setLastValue] = useState("")

  useEffect(() => {
    if (inputValue === lastValue) return

    const timer = setTimeout(() => {
      onSearch(inputValue || "")
      setLastValue(inputValue || "")
    }, 500)

    return () => clearTimeout(timer)
  }, [inputValue, lastValue, onSearch])

  const safeOptions: OptionType[] = (options ?? []).filter((o): o is OptionType => o !== null)

  const styles = useMemo(() => {
    const themed = getReactSelectStyles(isDark, { isDisabled: disabled })

    return {
      ...themed,
      menuList: (base: object) => ({ ...base, maxHeight: "150px" }),
      control: (base: object) => {
        const control = themed.control(base)
        return {
          ...control,
          minHeight: "34px",
          height: "auto",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
        }
      },
      indicatorsContainer: (base: object) => ({
        ...base,
        height: "auto",
        display: "flex",
        alignItems: "center",
      }),
      valueContainer: (base: object) => ({
        ...base,
        paddingLeft: "40px",
        flexWrap: "wrap",
        gap: "4px",
        paddingTop: "4px",
        paddingBottom: "4px",
      }),
      input: (base: object) => ({ ...base, margin: 0, padding: 0 }),
      placeholder: (base: object) => ({
        ...base,
        marginLeft: "2px",
        fontWeight: 700,
        color: isDark ? "#a898c8" : "#9ca3af",
        fontSize: "12px",
      }),
    }
  }, [isDark, disabled])

  return (
    <div className="relative w-full">
      <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
        <MagnifyingGlassIcon className="h-4 w-4 text-(--yoco-text-muted)" />
      </div>

      <Select
        isMulti={isMulti}
        isDisabled={disabled}
        {...(register ? register(name) : {})}
        options={safeOptions}
        value={watch(name) ?? null}
        isClearable
        placeholder={placeholder}
        isLoading={!!isLoading && inputValue.length > 0}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
        components={{
          LoadingIndicator: (props) =>
            isLoading ? <components.LoadingIndicator {...props} /> : null,
          IndicatorSeparator: () => null,
        }}
        onChange={(option, actionMeta) => {
          if (actionMeta.action === "clear") {
            setSelectedOption(null)
            setInputValue("")
            setLastValue("")
            setValue(name, undefined, { shouldValidate: true })
            onChange?.(null)
            onSearch("")
            return
          }

          setSelectedOption(option as OptionType)
          setValue(name, option, { shouldValidate: true })
          onChange?.(option as OptionType | OptionType[] | null)
        }}
        onInputChange={(value, { action }) => {
          if (action !== "input-change") return value
          setInputValue(value)
          return value
        }}
        loadingMessage={() => (isLoading ? "Searching..." : null)}
        noOptionsMessage={({ inputValue: query }) => {
          if (isLoading) return "Searching..."
          if (!query) return "No data available"
          return "No results found"
        }}
        styles={styles}
      />
    </div>
  )
}

export default DebounceSelect
