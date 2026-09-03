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
import { branchesApi, eldersApi, dashboardApi } from '@/services/api'
import { StatCard } from '@/components/shared/StatCard'
import { LoadingSpinner, PageLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import type { Branch, Elder } from '@/types'

function getId(item: { id?: string; _id?: string } | null | undefined): string {
  return item?.id || item?._id || ''
}

export default function BranchDashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuth()

  const [branch, setBranch] = useState<Branch | null>(null)
  const [elders, setElders] = useState<Elder[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchAll(id)
  }, [id])

  async function fetchAll(branchId: string) {
    setLoading(true)
    try {
      const [branchData, elderResult, statsData] = await Promise.all([
        branchesApi.getById(branchId),
        eldersApi.getAll({ branch_id: branchId, status: 'active' }),
        dashboardApi.getStats(),
      ])
      setBranch(branchData)
      setElders(elderResult.data || [])
    } catch {
      toast.error('Failed to load branch data')
    }
    setLoading(false)
  }

  const filtered = elders.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.admissionNumber.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <div className="p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/branches')} className="-ml-2">
          <ArrowLeft size={16} />
          Back to Branches
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{branch?.name || 'Branch'}</h1>
          <p className="text-gray-600 mt-1">Branch dashboard — live statistics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Current Elders" value={filtered.length} icon={Users} gradient="stat-gradient-blue" />
          <StatCard title="Admissions" value={0} icon={TrendingUp} gradient="stat-gradient-green" />
          <StatCard title="Transfers In" value={0} icon={ArrowLeftRight} gradient="stat-gradient-purple" />
          <StatCard title="Deaths" value={0} icon={Activity} gradient="stat-gradient-red" />
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
                      {['Adm. No.', 'Name', 'Age', 'Gender', 'Status', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => {
                      const elderId = getId(e)
                      return (
                        <tr key={elderId} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.admissionNumber}</td>
                          <td className="px-4 py-3 font-medium">{e.name}</td>
                          <td className="px-4 py-3">{e.age}</td>
                          <td className="px-4 py-3 capitalize">{e.gender}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={e.currentStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/elders/${elderId}`}>
                              <Button variant="ghost" size="sm">
                                <Eye size={14} />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
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
