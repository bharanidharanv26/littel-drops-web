import { useEffect, useState } from 'react'
import { dashboardApi, branchesApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { FileBarChart2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Branch } from '@/types'

type ReportType = 'branch_summary' | 'current_residents' | 'admissions' | 'transfers' | 'deaths' | 'returned_home' | 'requests'

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'branch_summary', label: 'Branch Summary' },
  { value: 'current_residents', label: 'Current Residents' },
  { value: 'admissions', label: 'Admissions' },
  { value: 'transfers', label: 'Transfers' },
  { value: 'deaths', label: 'Deaths' },
  { value: 'returned_home', label: 'Returned Home' },
  { value: 'requests', label: 'Requests' },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('branch_summary')
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchFilter, setBranchFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    branchesApi.getAll().then(setBranches).catch(() => {})
  }, [])

  useEffect(() => {
    loadReport()
  }, [reportType, branchFilter, dateFrom, dateTo])

  async function loadReport() {
    setLoading(true)
    try {
      const result = await dashboardApi.getReports({
        report_type: reportType,
        branch_id: branchFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setData(result || [])
    } catch (error) {
      toast.error('Failed to load report')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  function renderReportData() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileBarChart2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No data for this report</p>
        </div>
      )
    }

    // Branch Summary
    if (reportType === 'branch_summary') {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left font-medium">Branch</th>
              <th className="p-3 text-left font-medium">Current</th>
              <th className="p-3 text-left font-medium">Admissions</th>
              <th className="p-3 text-left font-medium">Transfers In</th>
              <th className="p-3 text-left font-medium">Transfers Out</th>
              <th className="p-3 text-left font-medium">Deaths</th>
              <th className="p-3 text-left font-medium">Returned</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3">{row.current_elders}</td>
                <td className="p-3">{row.admissions}</td>
                <td className="p-3">{row.transfers_in}</td>
                <td className="p-3">{row.transfers_out}</td>
                <td className="p-3">{row.deaths}</td>
                <td className="p-3">{row.returned_home}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    // Current Residents
    if (reportType === 'current_residents') {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left font-medium">S.No</th>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Adm. No.</th>
              <th className="p-3 text-left font-medium">Age</th>
              <th className="p-3 text-left font-medium">Branch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{row.serialNumber}</td>
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3">{row.admissionNumber}</td>
                <td className="p-3">{row.age}</td>
                <td className="p-3">{row.current_branch?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    // Generic fallback
    return (
      <div className="overflow-x-auto">
        <pre className="p-4 text-xs bg-gray-50 rounded-lg">
          {JSON.stringify(data.slice(0, 10), null, 2)}
        </pre>
        {data.length > 10 && (
          <p className="text-sm text-gray-500 p-3">Showing 10 of {data.length} records</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View organization reports and statistics</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium">Report Type</label>
              <select
                className="w-full h-10 px-3 border rounded-md text-sm mt-1"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                {REPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium">Branch</label>
              <select
                className="w-full h-10 px-3 border rounded-md text-sm mt-1"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {REPORT_OPTIONS.find((o) => o.value === reportType)?.label}
            {data.length > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({data.length} records)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderReportData()}
        </CardContent>
      </Card>
    </div>
  )
}
