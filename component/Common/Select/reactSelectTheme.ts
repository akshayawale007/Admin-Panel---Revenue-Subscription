export function getReactSelectStyles(isDark: boolean, options?: { isDisabled?: boolean }) {
  const disabled = options?.isDisabled ?? false

  return {
    container: (base: object) => ({ ...base, width: "100%" }),
    control: (base: object) => ({
      ...base,
      minHeight: 36,
      borderColor: isDark ? "#3d3254" : "#d1d5db",
      backgroundColor: disabled
        ? isDark
          ? "#1c1728"
          : "#f9fafb"
        : isDark
          ? "#221d2e"
          : "#ffffff",
      color: isDark ? "#ece6f8" : "#3d2d5c",
      boxShadow: "none",
      "&:hover": { borderColor: isDark ? "#8b6fc4" : "#9ca3af" },
    }),
    singleValue: (base: object) => ({
      ...base,
      color: isDark ? "#ece6f8" : "#3d2d5c",
    }),
    input: (base: object) => ({
      ...base,
      color: isDark ? "#ece6f8" : "#3d2d5c",
    }),
    menuPortal: (base: object) => ({ ...base, zIndex: 999999 }),
    menu: (base: object) => ({
      ...base,
      zIndex: 999999,
      backgroundColor: isDark ? "#1c1728" : "#ffffff",
      border: `1px solid ${isDark ? "#3d3254" : "#e5e7eb"}`,
    }),
    option: (base: object, state: { isFocused: boolean; isSelected: boolean }) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#674d9f"
        : state.isFocused
          ? isDark
            ? "#252033"
            : "#f3f4f6"
          : isDark
            ? "#1c1728"
            : "#ffffff",
      color: state.isSelected ? "#ffffff" : isDark ? "#ece6f8" : "#3d2d5c",
    }),
    placeholder: (base: object) => ({
      ...base,
      color: isDark ? "#a898c8" : "#9ca3af",
    }),
    dropdownIndicator: (base: object) => ({
      ...base,
      color: isDark ? "#a898c8" : "#6b7280",
    }),
    clearIndicator: (base: object) => ({
      ...base,
      color: isDark ? "#a898c8" : "#9ca3af",
      ":hover": { color: isDark ? "#ece6f8" : "#374151" },
    }),
    multiValue: (base: object) => ({
      ...base,
      backgroundColor: isDark ? "#252033" : "#f3f4f6",
    }),
    multiValueLabel: (base: object) => ({
      ...base,
      color: isDark ? "#ece6f8" : "#3d2d5c",
    }),
    multiValueRemove: (base: object) => ({
      ...base,
      color: isDark ? "#a898c8" : "#6b7280",
      ":hover": {
        backgroundColor: isDark ? "#3d3254" : "#e5e7eb",
        color: isDark ? "#ece6f8" : "#374151",
      },
    }),
  }
}
