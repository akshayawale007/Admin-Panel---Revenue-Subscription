// ── Sanitizers ────────────────────────────────────────────────
export const onlyLetters = (value: string): string =>
  value.replace(/^\s+/, "").replace(/[^A-Za-z\s]/g, "")
export const onlyDigits = (value: string): string => value.replace(/^\s+/, "").replace(/\D/g, "")
export const onlyDigitsMax =
  (limit: number) =>
  (value: string): string =>
    onlyDigits(value).slice(0, limit)
export const onlyAlphanumeric = (value: string): string =>
  value.replace(/^\s+/, "").replace(/[^A-Za-z0-9\s]/g, "")

/** Letters, numbers, single spaces only — no leading or double spaces */
export const onlyAlphanumericSingleSpace = (value: string): string =>
  value
    .replace(/^\s+/, "")
    .replace(/[^A-Za-z0-9\s]/g, "")
    .replace(/\s{2,}/g, " ")

export const ALPHANUMERIC_NAME_PATTERN = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/
export const NODE_NAME_MAX_LENGTH = 25

const toTitleCaseWord = (word: string): string => {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/** Sanitize + title case each word — e.g. "ground floor" → "Ground Floor" */
export const formatAlphanumericTitleCase = (value: string): string =>
  onlyAlphanumericSingleSpace(value)
    .split(" ")
    .map(toTitleCaseWord)
    .join(" ")
    .slice(0, NODE_NAME_MAX_LENGTH)

export const getAlphanumericNameError = (value: string): string | null => {
  if (!value.trim()) return "Name is required"
  if (value.trim().length > NODE_NAME_MAX_LENGTH) {
    return `Maximum ${NODE_NAME_MAX_LENGTH} characters allowed`
  }
  if (/^\s/.test(value)) return "Name cannot start with a space"
  if (/\s{2,}/.test(value)) return "Only one space is allowed between words"
  if (/[^A-Za-z0-9\s]/.test(value)) return "Only letters and numbers are allowed"
  if (!ALPHANUMERIC_NAME_PATTERN.test(value.trim())) return "Enter a valid name"
  return null
}
export const onlyAddressChars = (value: string): string =>
  value.replace(/^\s+/, "").replace(/[^A-Za-z0-9\s,.-]/g, "")
export const noLeadingSpaces = (value: string): string => value.replace(/^\s+/, "")

// ── Handler factory ───────────────────────────────────────────
type SanitizeFn = (value: string) => string
type SetValueFn = (
  name: string,
  value: string,
  options?: { shouldValidate?: boolean; shouldDirty?: boolean }
) => void

export const createSanitizedChangeHandler =
  (
    fieldName: string,
    setValue: SetValueFn,
    sanitizeFn: SanitizeFn,
    maxLength?: number,
    uppercase?: boolean
  ) =>
  (e: React.ChangeEvent<HTMLInputElement>): void => {
    let value = sanitizeFn(e.target.value)
    if (uppercase) value = value.toUpperCase()
    if (maxLength) value = value.slice(0, maxLength)
    setValue(fieldName, value, { shouldValidate: true, shouldDirty: true })
  }
