"use client"

import Modal from "@/component/Common/Modal/Modal"
import Button from "@/component/Common/Button/Button"

export default function ComingSoonDialog({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (v: boolean) => void
}) {
  return (
    <Modal open={open} setOpen={setOpen} width="md">
      <div className="p-5">
        <p className="yoco-form-title text-base">Coming soon</p>
        <div className="mt-6 flex justify-end">
          <Button title="Close" variant="secondary" onClick={() => setOpen(false)} />
        </div>
      </div>
    </Modal>
  )
}
