import type { Metadata } from "next"
import "./globals.css"
import { Quicksand } from "next/font/google"
import ReduxProvider from "@/src/redux/Provider"
import { HostelProvider } from "@/component/Hostel/HostelProvider"
import { RevenueProvider } from "@/component/Revenue/RevenueProvider"
import { ThemeProvider } from "@/component/Common/Theme/ThemeProvider"
import { themeInitScript } from "@/component/Common/Theme/themeScript"
import "flowbite/dist/flowbite.css"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Revenue/Subscriptions | YOCO",
  description: "Yoco Stays Super Admin — Revenue/Subscriptions",
  icons: {
    icon: "/fevicIcon.png",
    shortcut: "/fevicIcon.png",
    apple: "/fevicIcon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={quicksand.className}>
        <ThemeProvider>
          <ReduxProvider>
            <HostelProvider>
              <RevenueProvider>{children}</RevenueProvider>
            </HostelProvider>
          </ReduxProvider>
        </ThemeProvider>
        <ToastContainer
          position="top-right"
          autoClose={2000}
          pauseOnHover={false}
          theme="colored"
        />
      </body>
    </html>
  )
}
