"use client"

import Sidebar from "./sidebar"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  )
}
