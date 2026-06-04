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
        title="Panel"
        description="Resumen de tu actividad de impresión de etiquetas"
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <KpiCard
            title="Etiquetas impresas hoy"
            value="1.247"
            change="+12% respecto a ayer"
            changeType="positive"
            icon={Tag}
          />
          <KpiCard
            title="Trabajos totales"
            value="24"
            change="8 pendientes"
            changeType="neutral"
            icon={Printer}
          />
          <KpiCard
            title="Templates activos"
            value="12"
            change="2 nuevos esta semana"
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
