import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} font-sans`}>{children}</body>
    </html>
  )
}

export const metadata = {
  title: "NBU Office Digital Twin - Facility Management Dashboard",
  description: "BIM-driven 3D Digital Twin and Facility Management for NBU Office Building",
  generator: "Shah",
}
