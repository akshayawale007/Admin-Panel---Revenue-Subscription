const EMPTY_TIME_VALUES = new Set(["00:00", "00:00:00"])

export const normalizeVisitingHours = (value?: string | null): string => {
  if (!value) return ""
  const trimmed = value.trim()
  if (EMPTY_TIME_VALUES.has(trimmed)) return ""
  return trimmed
}
