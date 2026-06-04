import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Tag, Printer, FileStack } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Header
        title="Dashboard"
        description="Overview of your label printing activity"
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <KpiCard
            title="Labels Printed Today"
            value="1,247"
            change="+12% from yesterday"
            changeType="positive"
            icon={Tag}
          />
          <KpiCard
            title="Total Jobs"
            value="24"
            change="8 pending"
            changeType="neutral"
            icon={Printer}
          />
          <KpiCard
            title="Active Templates"
            value="12"
            change="2 new this week"
            changeType="positive"
            icon={FileStack}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </DashboardLayout>
  )
}
