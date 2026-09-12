"use client"

import { Provider } from "react-redux"
import { store } from "./store"
import ToastProvider from "@/component/Common/Toaster/Taoster"

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <ToastProvider />
    </Provider>
  )
}
