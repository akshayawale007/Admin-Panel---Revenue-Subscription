import React from "react"
import { UseFormRegister } from "react-hook-form"

type InputProps = {
  loading?: boolean
  register?: UseFormRegister<any>
  name?: string
  type?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  placeholder?: string
  value?: string
  label?: string
  required?: boolean
  className?: string
  max?: string // ✅ add this
  min?: string // ✅ good to have too
  maxLength?: number
}

const Input: React.FC<InputProps> = ({
  loading = false,
  register,
  name,
  type = "text",
  onChange,
  error,
  placeholder,
  value,
  label,
  required = false,
  className = "placeholder:font-normal",
  max,
  min,
  maxLength,
}) => {
  const registerProps = register && name ? register(name) : {}

  return (
    <div>
      {label && (
        <label className={`mb-1 block text-sm font-bold text-(--yoco-text-muted)`}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        disabled={loading}
        {...registerProps}
        type={type}
        onChange={onChange}
        value={value}
        max={max}
        min={min}
        maxLength={maxLength}
        className={`${className} yoco-input focus:shadow-outline focus:text-md mt-1 appearance-none px-3 py-1.5 leading-tight font-bold placeholder:text-xs focus:font-semibold ${
          loading ? "cursor-not-allowed opacity-60" : ""
        }`}
        placeholder={placeholder}
      />
      {error && <p className="mt-1 text-xs font-bold text-rose-500">{error}</p>}
    </div>
  )
}

export default Input
