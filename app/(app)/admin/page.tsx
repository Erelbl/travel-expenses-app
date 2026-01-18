import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getAdminStats } from "@/lib/server/adminStats"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Users, UserCheck, UserX, Calendar, MapPin, Receipt } from "lucide-react"
import { SetPasswordForm } from "./SetPasswordForm"

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const adminEmailsEnv = process.env.ADMIN_EMAILS || ""
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
  
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/auth/login")
  }
  
  if (!isAdminEmail(session.user.email)) {
    notFound()
  }
  
  const stats = await getAdminStats()
  const secondsAgo = Math.floor((Date.now() - stats.timestamp) / 1000)
  
  return (
    <PageContainer>
      <PageHeader 
        title="Admin Dashboard" 
        description={`System statistics • Updated ${secondsAgo}s ago`} 
      />
      
      <div className="space-y-8">
        {/* Admin Tools */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Admin Tools</h2>
          <SetPasswordForm />
        </section>

        {/* Users Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats.users.total.toLocaleString()}
              icon={Users}
            />
            <StatCard
              title="Verified"
              value={stats.users.verified.toLocaleString()}
              icon={UserCheck}
            />
            <StatCard
              title="Unverified"
              value={stats.users.unverified.toLocaleString()}
              icon={UserX}
            />
            <StatCard
              title="Last 7 Days"
              value={stats.users.createdLast7d.toLocaleString()}
              icon={Calendar}
              subtitle="New users"
            />
          </div>
        </section>
        
        {/* Trips Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Total Trips"
              value={stats.trips.total.toLocaleString()}
              icon={MapPin}
            />
            <StatCard
              title="Last 7 Days"
              value={stats.trips.createdLast7d.toLocaleString()}
              icon={Calendar}
              subtitle="New trips"
            />
          </div>
        </section>
        
        {/* Expenses Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Expenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Total Expenses"
              value={stats.expenses.total.toLocaleString()}
              icon={Receipt}
            />
            <StatCard
              title="Last 7 Days"
              value={stats.expenses.createdLast7d.toLocaleString()}
              icon={Calendar}
              subtitle="New expenses"
            />
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

