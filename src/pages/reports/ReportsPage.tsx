import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Elder, Transfer, Death, AuditLog, Branch } from '@/types'

type ReportType = 'branch_summary' | 'current_residents' | 'admissions' | 'transfers' | 'deaths' | 'returns' | 'audit'

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('branch_summary')
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')

  const [branchSummary, setBranchSummary] = useState<Array<{
    id: string; name: string; current_elders: number; admissions: number;
    deaths: number; transfers_in: number; transfers_out: number; male: number; female: number
  }>>([])
  const [elders, setElders] = useState<Elder[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [deaths, setDeaths] = useState<Death[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchReport()
  }, [reportType, dateFrom, dateTo, branchFilter])

  async function fetchBranches() {
    const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('name')
    setBranches((data as Branch[]) ?? [])
  }

  async function fetchReport() {
    setLoading(true)
    switch (reportType) {
      case 'branch_summary': await fetchBranchSummary(); break
      case 'current_residents': await fetchCurrentResidents(); break
      case 'admissions': await fetchAdmissions(); break
      case 'transfers': await fetchTransfers(); break
      case 'deaths': await fetchDeaths(); break
      case 'returns': await fetchReturns(); break
      case 'audit': await fetchAudit(); break
    }
    setLoading(false)
  }

  async function fetchBranchSummary() {
    const { data: branchList } = await supabase
      .from('branches').select('id, name').eq('is_active', true).order('name')
    if (!branchList) { setBranchSummary([]); return }

    const rows = await Promise.all(
      branchList.map(async (b: { id: string; name: string }) => {
        const [current, admissions, deaths, inRes, outRes, maleRes, femaleRes] = await Promise.all([
          supabase.from('elders').select('id', { count: 'exact' }).eq('current_branch_id', b.id).eq('status', 'active'),
          supabase.from('admissions').select('id', { count: 'exact' }).eq('admission_branch_id', b.id),
          supabase.from('deaths').select('id', { count: 'exact' }).eq('branch_id', b.id),
          supabase.from('transfers').select('id', { count: 'exact' }).eq('to_branch_id', b.id),
          supabase.from('transfers').select('id', { count: 'exact' }).eq('from_branch_id', b.id),
          supabase.from('elders').select('id', { count: 'exact' }).eq('current_branch_id', b.id).eq('status', 'active').eq('gender', 'male'),
          supabase.from('elders').select('id', { count: 'exact' }).eq('current_branch_id', b.id).eq('status', 'active').eq('gender', 'female'),
        ])
        return {
          id: b.id, name: b.name,
          current_elders: current.count ?? 0,
          admissions: admissions.count ?? 0,
          deaths: deaths.count ?? 0,
          transfers_in: inRes.count ?? 0,
          transfers_out: outRes.count ?? 0,
          male: maleRes.count ?? 0,
          female: femaleRes.count ?? 0,
        }
      })
    )
    setBranchSummary(rows)
  }

  async function fetchCurrentResidents() {
    let query = supabase
      .from('elders')
      .select('*, current_branch:branches!current_branch_id(id, name)')
      .eq('status', 'active')
      .order('name')
    if (branchFilter !== 'all') query = query.eq('current_branch_id', branchFilter)
    const { data } = await query
    setElders((data as Elder[]) ?? [])
  }

  async function fetchAdmissions() {
    let query = supabase
      .from('elders')
      .select('*, admission_branch:branches!admission_branch_id(id, name)')
      .order('admission_date', { ascending: false })
    if (branchFilter !== 'all') query = query.eq('admission_branch_id', branchFilter)
    if (dateFrom) query = query.gte('admission_date', dateFrom)
    if (dateTo) query = query.lte('admission_date', dateTo)
    const { data } = await query
    setElders((data as Elder[]) ?? [])
  }

  async function fetchTransfers() {
    let query = supabase
      .from('transfers')
      .select('*, elder:elders!elder_id(name, admission_number), from_branch:branches!from_branch_id(name), to_branch:branches!to_branch_id(name)')
      .order('transfer_date', { ascending: false })
    if (dateFrom) query = query.gte('transfer_date', dateFrom)
    if (dateTo) query = query.lte('transfer_date', dateTo)
    const { data } = await query
    setTransfers((data as Transfer[]) ?? [])
  }

  async function fetchDeaths() {
    let query = supabase
      .from('deaths')
      .select('*, elder:elders!elder_id(name, admission_number), branch:branches!branch_id(name)')
      .order('death_date', { ascending: false })
    if (branchFilter !== 'all') query = query.eq('branch_id', branchFilter)
    if (dateFrom) query = query.gte('death_date', dateFrom)
    if (dateTo) query = query.lte('death_date', dateTo)
    const { data } = await query
    setDeaths((data as Death[]) ?? [])
  }

  async function fetchReturns() {
    const { data } = await supabase
      .from('elders')
      .select('*, current_branch:branches!current_branch_id(id, name)')
      .eq('status', 'returned_home')
      .order('name')
    setElders((data as Elder[]) ?? [])
  }

  async function fetchAudit() {
    let query = supabase
      .from('audit_logs')
      .select('*, user:profiles!user_id(name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
    const { data } = await query
    setAuditLogs((data as AuditLog[]) ?? [])
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Reports" subtitle="Branch-wise live metrics from centralized records" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Report Type</Label>
                <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch_summary">Branch Summary</SelectItem>
                    <SelectItem value="current_residents">Current Residents</SelectItem>
                    <SelectItem value="admissions">Admissions Report</SelectItem>
                    <SelectItem value="transfers">Transfers Report</SelectItem>
                    <SelectItem value="deaths">Deaths Report</SelectItem>
                    <SelectItem value="returns">Returns Report</SelectItem>
                    <SelectItem value="audit">Audit Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Branch</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
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
              </div>
              <div className="space-y-1">
                <Label className="text-xs">From Date</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? <PageLoader /> : (
          <>
            {/* Branch Summary */}
            {reportType === 'branch_summary' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Branch Performance Summary</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {['Branch', 'Current', 'Male', 'Female', 'Admissions', 'Transfers In', 'Transfers Out', 'Deaths'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {branchSummary.map(r => (
                          <tr key={r.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{r.name}</td>
                            <td className="px-4 py-3 font-semibold text-blue-600">{r.current_elders}</td>
                            <td className="px-4 py-3">{r.male}</td>
                            <td className="px-4 py-3">{r.female}</td>
                            <td className="px-4 py-3">{r.admissions}</td>
                            <td className="px-4 py-3 text-green-600">{r.transfers_in}</td>
                            <td className="px-4 py-3 text-amber-600">{r.transfers_out}</td>
                            <td className="px-4 py-3 text-red-600">{r.deaths}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Residents */}
            {reportType === 'current_residents' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Current Residents ({elders.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {['S.No', 'Name', 'Adm No.', 'Age', 'Gender', 'Branch', 'Adm Date'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {elders.map(e => (
                          <tr key={e.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3 font-mono text-xs">{e.serial_number ?? '—'}</td>
                            <td className="px-4 py-3 font-medium">{e.name}</td>
                            <td className="px-4 py-3 font-mono text-xs">{e.admission_number}</td>
                            <td className="px-4 py-3">{e.age}</td>
                            <td className="px-4 py-3 capitalize">{e.gender}</td>
                            <td className="px-4 py-3">{(e as any).current_branch?.name ?? '—'}</td>
                            <td className="px-4 py-3">{formatDate(e.admission_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admissions Report */}
            {reportType === 'admissions' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Admissions Report ({elders.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {['Name', 'Adm No.', 'Age', 'Gender', 'Branch', 'Adm Date', 'Status'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {elders.map(e => (
                          <tr key={e.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{e.name}</td>
                            <td className="px-4 py-3 font-mono text-xs">{e.admission_number}</td>
                            <td className="px-4 py-3">{e.age}</td>
                            <td className="px-4 py-3 capitalize">{e.gender}</td>
                            <td className="px-4 py-3">{(e as any).admission_branch?.name ?? '—'}</td>
                            <td className="px-4 py-3">{formatDate(e.admission_date)}</td>
                            <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transfers Report */}
            {reportType === 'transfers' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Transfers Report ({transfers.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {['Elder', 'Adm No.', 'From', 'To', 'Date', 'Reason'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transfers.map(t => {
                          const elderData = (t as any).elder
                          const fromBranch = (t as any).from_branch
                          const toBranch = (t as any).to_branch
                          return (
                            <tr key={t.id} className="border-b hover:bg-muted/30">
                              <td className="px-4 py-3 font-medium">{elderData?.name ?? '—'}</td>
                              <td className="px-4 py-3 font-mono text-xs">{elderData?.admission_number ?? '—'}</td>
                              <td className="px-4 py-3">{fromBranch?.name ?? '—'}</td>
                              <td className="px-4 py-3">{toBranch?.name ?? '—'}</td>
                              <td className="px-4 py-3">{formatDate(t.transfer_date)}</td>
                              <td className="px-4 py-3 text-muted-foreground truncate max-w-40">{t.reason ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deaths Report */}
            {reportType === 'deaths' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Deaths Report ({deaths.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {['Elder', 'Branch', 'Death Date', 'Remarks'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deaths.map(d => {
                          const elderData = (d as any).elder
                          const branchData = (d as any).branch
                          return (
                            <tr key={d.id} className="border-b hover:bg-muted/30">
                              <td className="px-4 py-3 font-medium">{elderData?.name ?? '—'}</td>
                              <td className="px-4 py-3">{branchData?.name ?? '—'}</td>
                              <td className="px-4 py-3">{formatDate(d.death_date)}</td>
                              <td className="px-4 py-3 text-muted-foreground">{d.remarks ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Returns Report */}
            {reportType === 'returns' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Returns Report ({elders.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {['Name', 'Adm No.', 'Last Branch', 'Reason'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {elders.map(e => (
                          <tr key={e.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{e.name}</td>
                            <td className="px-4 py-3 font-mono text-xs">{e.admission_number}</td>
                            <td className="px-4 py-3">{(e as any).current_branch?.name ?? '—'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{e.outcome_reason ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Report */}
            {reportType === 'audit' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Audit Report ({auditLogs.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {['Date', 'User', 'Action', 'Entity', 'Details'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map(log => (
                          <tr key={log.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.created_at)}</td>
                            <td className="px-4 py-3">{(log as any).user?.name ?? 'System'}</td>
                            <td className="px-4 py-3">{log.action}</td>
                            <td className="px-4 py-3">{log.entity_type}</td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-48 truncate">
                              {log.details ? JSON.stringify(log.details) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
