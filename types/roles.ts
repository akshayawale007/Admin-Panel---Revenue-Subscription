import { ReactNode } from "react"

export type props = {
  open?: boolean
  title?: string
  onClick?: () => void
  setOpen?: (value: boolean) => void
  children?: ReactNode
  back?: boolean
  rest?: ReactNode
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
  height?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "90vh" | "95vh" | "screen" | "fit"
  contentClassName?: string
  closeOnOutsideClick?: boolean
}
