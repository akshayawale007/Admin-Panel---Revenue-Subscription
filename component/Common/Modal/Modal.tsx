"use client"
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react"
import { props } from "@/types/roles"

const widthMap = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
}

const heightMap = {
  sm: "sm:max-h-48",
  md: "sm:max-h-64",
  lg: "sm:max-h-96",
  xl: "sm:max-h-[32rem]",
  "2xl": "sm:max-h-[40rem]",
  "3xl": "sm:max-h-[48rem]",
  "4xl": "sm:max-h-[56rem]",
  "5xl": "sm:max-h-[64rem]",
  "90vh": "h-[min(90dvh,100%)] max-h-full",
  "95vh": "h-[min(94dvh,100%)] max-h-full",
  screen: "h-full max-h-full",
  fit: "h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden",
}

export default function Modal({
  open = false,
  setOpen = () => {},
  children,
  width = "lg", // 👈 default width,
  height,
  contentClassName = "px-5 py-5",
  closeOnOutsideClick = true,
}: props) {
  const handleClose = () => {
    if (closeOnOutsideClick) {
      setOpen(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} className="relative z-[200]">
        <DialogBackdrop
          transition
          className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />
        <div className="fixed inset-0 z-[210] w-screen overflow-hidden">
          <div className="flex h-full items-center justify-center p-3 sm:p-4">
            <DialogPanel
              transition
              className={`relative w-full transform overflow-hidden rounded-lg border border-(--yoco-border-subtle) bg-(--yoco-surface-elevated) text-left text-(--yoco-text) shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-closed:sm:translate-y-0 data-closed:sm:scale-95 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in ${widthMap[width]} ${
                height ? `${heightMap[height]} flex min-h-0 flex-col` : "max-h-full overflow-y-auto"
              }`}
            >
              <div
                className={`bg-(--yoco-surface-elevated) text-left ${contentClassName} ${
                  height ? "flex min-h-0 flex-1 flex-col overflow-hidden" : ""
                }`}
              >
                {children}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  )
}
