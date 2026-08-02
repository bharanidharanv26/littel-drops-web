import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, ArrowLeftRight, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { Elder, Branch, ElderStatus } from '@/types'

export function ElderList() {
  const navigate = useNavigate()
  const { canWrite } = useAuth()

  const [elders, setElders] = useState<Elder[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<ElderStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const PAGE_SIZE = 25

  const fetchElders = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('elders')
      .select(`
        *,
        current_branch:branches!current_branch_id(id, name),
        admission_branch:branches!admission_branch_id(id, name)
      `)
      .order('name')

    if (branchFilter !== 'all') query = query.eq('current_branch_id', branchFilter)
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query
    const list = (data as Elder[]) ?? []

    if (!search.trim()) {
      setTotalRows(list.length)
      const start = page * PAGE_SIZE
      const end = start + PAGE_SIZE
      setElders(list.slice(start, end))
      setLoading(false)
      return
    }

    const q = search.trim().toLowerCase()
    const filtered = list.filter((elder) => {
      const branchName = elder.current_branch?.name?.toLowerCase() ?? ''
      return (
        elder.name.toLowerCase().includes(q) ||
        elder.admission_number.toLowerCase().includes(q) ||
        elder.phone.toLowerCase().includes(q) ||
        elder.id.toLowerCase().includes(q) ||
        branchName.includes(q)
      )
    })

    setTotalRows(filtered.length)
    const start = page * PAGE_SIZE
    const end = start + PAGE_SIZE
    setElders(filtered.slice(start, end))
    setLoading(false)
  }, [page, branchFilter, statusFilter, search])

  useEffect(() => {
    supabase.from('branches').select('*').eq('is_active', true).order('name').then(({ data }) => {
      setBranches((data as Branch[]) ?? [])
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchElders, 300)
    return () => clearTimeout(t)
  }, [fetchElders])

  return (
    <div className="animate-fade-in">
      <TopBar title="Elders" subtitle="All elder records across all branches" />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, admission no., phone, branch, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="pl-9"
            />
          </div>
          <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(0) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as ElderStatus | 'all'); setPage(0) }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
              <SelectItem value="deceased">Deceased</SelectItem>
            </SelectContent>
          </Select>
          {canWrite && (
            <Button onClick={() => navigate('/elders/new')} className="ml-auto">
              <Plus size={16} />
              Add Elder
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <PageLoader />
            ) : elders.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No elders found"
                description="Try adjusting your search or filters."
                action={
                  canWrite ? (
                    <Button onClick={() => navigate('/elders/new')}>
                      <Plus size={16} />
                      Add First Elder
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {['Adm. No.', 'Name', 'Age', 'Gender', 'Current Branch', 'Adm. Date', 'Status', 'Actions'].map(
                        (h) => (
                          <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {elders.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {e.admission_number}
                        </td>
                        <td className="px-4 py-3 font-medium">{e.name}</td>
                        <td className="px-4 py-3">{e.age}</td>
                        <td className="px-4 py-3 capitalize">{e.gender}</td>
                        <td className="px-4 py-3">{e.current_branch?.name ?? '—'}</td>
                        <td className="px-4 py-3">{formatDate(e.admission_date)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Link to={`/elders/${e.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <Eye size={13} />
                                View
                              </Button>
                            </Link>
                            {canWrite && e.status === 'active' && (
                              <Link to={`/transfers?elder=${e.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                  <ArrowLeftRight size={13} />
                                  Transfer
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {totalRows === 0
              ? 'Showing 0–0 of 0'
              : `Showing ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + elders.length} of ${totalRows}`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= totalRows}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
