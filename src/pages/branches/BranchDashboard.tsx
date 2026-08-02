import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Users,
  ArrowLeftRight,
  TrendingUp,
  Activity,
  ArrowLeft,
  Plus,
  Eye,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { Branch, Elder } from '@/types'

interface BranchStats {
  current: number
  admissions: number
  transfers_in: number
  transfers_out: number
  deaths: number
}

export function BranchDashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuth()

  const [branch, setBranch] = useState<Branch | null>(null)
  const [stats, setStats] = useState<BranchStats | null>(null)
  const [elders, setElders] = useState<Elder[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchAll(id)
  }, [id])

  async function fetchAll(branchId: string) {
    setLoading(true)
    const [branchRes] = await Promise.all([
      supabase.from('branches').select('*').eq('id', branchId).single(),
    ])
    setBranch(branchRes.data as Branch)

    const [currentRes, admissionsRes, tInRes, tOutRes, deathsRes, eldersRes] = await Promise.all([
      supabase.from('elders').select('id', { count: 'exact' }).eq('current_branch_id', branchId).eq('status', 'active'),
      supabase.from('admissions').select('id', { count: 'exact' }).eq('admission_branch_id', branchId),
      supabase.from('transfers').select('id', { count: 'exact' }).eq('to_branch_id', branchId),
      supabase.from('transfers').select('id', { count: 'exact' }).eq('from_branch_id', branchId),
      supabase.from('deaths').select('id', { count: 'exact' }).eq('branch_id', branchId),
      supabase
        .from('elders')
        .select('*, current_branch:branches!current_branch_id(name), admission_branch:branches!admission_branch_id(name)')
        .eq('current_branch_id', branchId)
        .eq('status', 'active')
        .order('name'),
    ])

    setStats({
      current: currentRes.count ?? 0,
      admissions: admissionsRes.count ?? 0,
      transfers_in: tInRes.count ?? 0,
      transfers_out: tOutRes.count ?? 0,
      deaths: deathsRes.count ?? 0,
    })
    setElders(eldersRes.data as Elder[] ?? [])
    setLoading(false)
  }

  const filtered = elders.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.admission_number.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <TopBar
        title={branch?.name ?? 'Branch'}
        subtitle="Branch dashboard — live statistics"
      />
      <div className="p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/branches')} className="-ml-2">
          <ArrowLeft size={16} />
          Back to Branches
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard title="Current Elders" value={stats?.current ?? 0} icon={Users} gradient="stat-gradient-blue" />
          <StatCard title="Admissions" value={stats?.admissions ?? 0} icon={TrendingUp} gradient="stat-gradient-green" />
          <StatCard title="Transfers In" value={stats?.transfers_in ?? 0} icon={ArrowLeftRight} gradient="stat-gradient-purple" />
          <StatCard title="Transfers Out" value={stats?.transfers_out ?? 0} icon={ArrowLeftRight} gradient="stat-gradient-amber" />
          <StatCard title="Deaths" value={stats?.deaths ?? 0} icon={Activity} gradient="stat-gradient-red" />
        </div>

        {/* Active Elders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Active Elders ({filtered.length})
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search name or admission no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-56 text-sm"
                />
                {canWrite && (
                  <Button size="sm" onClick={() => navigate('/elders/new')}>
                    <Plus size={14} />
                    Add Elder
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No active elders"
                description="No elders are currently staying in this branch."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {['Adm. No.', 'Name', 'Age', 'Gender', 'Admission Date', 'Status', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.admission_number}</td>
                        <td className="px-4 py-3 font-medium">{e.name}</td>
                        <td className="px-4 py-3">{e.age}</td>
                        <td className="px-4 py-3 capitalize">{e.gender}</td>
                        <td className="px-4 py-3">{formatDate(e.admission_date)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/elders/${e.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye size={14} />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
