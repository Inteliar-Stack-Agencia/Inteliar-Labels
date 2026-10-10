"use client"

import { Sidebar } from "./sidebar"
import { TrialGate } from "./trial-gate"
import { SupportBanner } from "./support-banner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SupportBanner />
      <Sidebar />
      <TrialGate>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </TrialGate>
    </div>
  )
}
