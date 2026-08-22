import { useEffect, useState } from 'react'
import {
  Users,
  Building2,
  ArrowLeftRight,
  Heart,
  TrendingUp,
  Activity,
  Bell,
  ClipboardCheck,
  Clock,
  UserCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface GlobalStats {
  total_elders: number
  active_elders: number
  total_deaths: number
  total_transfers: number
  total_branches: number
  total_admissions: number
  male_count: number
  female_count: number
}

interface BranchRow {
  id: string
  name: string
  current: number
  admissions: number
  transfers_in: number
  transfers_out: number
  deaths: number
}

interface NotificationRow {
  id: string
  title: string
  message: string
  is_read: boolean
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

interface AuditLogRow {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
  user?: { name: string } | null
}

export function GlobalDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [branches, setBranches] = useState<BranchRow[]>([])
  const [recentLogs, setRecentLogs] = useState<AuditLogRow[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchStats(), fetchBranchStats(), fetchRecentLogs(), fetchNotifications()])
    setLoading(false)
  }

  async function fetchStats() {
    const [eldersRes, branchesRes, transfersRes, deathsRes, admissionsRes] = await Promise.all([
      supabase.from('elders').select('id, status, gender', { count: 'exact' }),
      supabase.from('branches').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('transfers').select('id', { count: 'exact' }),
      supabase.from('deaths').select('id', { count: 'exact' }),
      supabase.from('admissions').select('id', { count: 'exact' }),
    ])
    const allElders = (eldersRes.data ?? []) as Array<{ status?: string; gender?: string }>
    setStats({
      total_elders: eldersRes.count ?? 0,
      active_elders: allElders.filter((e) => e.status === 'active').length,
      total_deaths: deathsRes.count ?? 0,
      total_transfers: transfersRes.count ?? 0,
      total_branches: branchesRes.count ?? 0,
      total_admissions: admissionsRes.count ?? 0,
      male_count: allElders.filter((e) => e.status === 'active' && e.gender === 'male').length,
      female_count: allElders.filter((e) => e.status === 'active' && e.gender === 'female').length,
    })
  }

  async function fetchBranchStats() {
    const { data: branchList } = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (!branchList) return

    const rows = await Promise.all(
      branchList.map(async (b: { id: string; name: string }) => {
        const [currentRes, admissionsRes, transfersInRes, transfersOutRes, deathsRes] =
          await Promise.all([
            supabase
              .from('elders')
              .select('id', { count: 'exact' })
              .eq('current_branch_id', b.id)
              .eq('status', 'active'),
            supabase
              .from('admissions')
              .select('id', { count: 'exact' })
              .eq('admission_branch_id', b.id),
            supabase
              .from('transfers')
              .select('id', { count: 'exact' })
              .eq('to_branch_id', b.id),
            supabase
              .from('transfers')
              .select('id', { count: 'exact' })
              .eq('from_branch_id', b.id),
            supabase
              .from('deaths')
              .select('id', { count: 'exact' })
              .eq('branch_id', b.id),
          ])
        return {
          id: b.id,
          name: b.name,
          current: currentRes.count ?? 0,
          admissions: admissionsRes.count ?? 0,
          transfers_in: transfersInRes.count ?? 0,
          transfers_out: transfersOutRes.count ?? 0,
          deaths: deathsRes.count ?? 0,
        }
      })
    )
    setBranches(rows)
  }

  async function fetchRecentLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*, user:profiles(name)')
      .order('created_at', { ascending: false })
      .limit(8)
    if (data) setRecentLogs(data as unknown as AuditLogRow[])
  }

  async function fetchNotifications() {
    if (!profile) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setNotifications(data as NotificationRow[])
  }

  async function markAllRead() {
    if (!profile) return
    for (const n of notifications.filter(n => !n.is_read)) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  if (loading) return <PageLoader />

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="animate-fade-in">
      <TopBar title="Dashboard" subtitle="Overview of all Little Drops branches" />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
          <StatCard
            title="Total Elders"
            value={stats?.total_elders ?? 0}
            icon={Users}
            gradient="stat-gradient-blue"
          />
          <StatCard
            title="Active Elders"
            value={stats?.active_elders ?? 0}
            icon={Heart}
            gradient="stat-gradient-green"
          />
          <StatCard
            title="Male"
            value={stats?.male_count ?? 0}
            icon={Users}
            gradient="stat-gradient-blue"
          />
          <StatCard
            title="Female"
            value={stats?.female_count ?? 0}
            icon={Users}
            gradient="stat-gradient-pink"
          />
          <StatCard
            title="Total Admissions"
            value={stats?.total_admissions ?? 0}
            icon={TrendingUp}
            gradient="stat-gradient-purple"
          />
          <StatCard
            title="Total Transfers"
            value={stats?.total_transfers ?? 0}
            icon={ArrowLeftRight}
            gradient="stat-gradient-amber"
          />
          <StatCard
            title="Total Deaths"
            value={stats?.total_deaths ?? 0}
            icon={Activity}
            gradient="stat-gradient-red"
          />
          <StatCard
            title="Branches"
            value={stats?.total_branches ?? 0}
            icon={Building2}
            gradient="stat-gradient-teal"
          />
        </div>

        {/* Branch Summary Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Branch Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {['Branch', 'Current Elders', 'Admissions', 'Transfers In', 'Transfers Out', 'Deaths'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b, i) => (
                    <tr
                      key={b.id}
                      className={`border-b transition-colors hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">{b.current}</td>
                      <td className="px-4 py-3">{b.admissions}</td>
                      <td className="px-4 py-3 text-green-600">{b.transfers_in}</td>
                      <td className="px-4 py-3 text-amber-600">{b.transfers_out}</td>
                      <td className="px-4 py-3 text-red-600">{b.deaths}</td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No branches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bell size={16} />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs ml-1">{unreadCount}</Badge>
                  )}
                </CardTitle>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
                    Mark All Read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${!n.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!n.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Bell size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!n.is_read ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock size={16} />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Activity size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        by {log.user?.name ?? 'System'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No activity logged yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
