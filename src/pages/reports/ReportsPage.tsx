import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/shared/LoadingSpinner'

interface BranchReportRow {
  id: string
  name: string
  current_elders: number
  admissions: number
  deaths: number
  transfers_in: number
  transfers_out: number
}

export function ReportsPage() {
  const [rows, setRows] = useState<BranchReportRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)

    const { data: branches } = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (!branches) {
      setRows([])
      setLoading(false)
      return
    }

    const reportRows = await Promise.all(
      branches.map(async (b: { id: string; name: string }) => {
        const [current, admissions, deaths, inRes, outRes] = await Promise.all([
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
            .from('deaths')
            .select('id', { count: 'exact' })
            .eq('branch_id', b.id),
          supabase
            .from('transfers')
            .select('id', { count: 'exact' })
            .eq('to_branch_id', b.id),
          supabase
            .from('transfers')
            .select('id', { count: 'exact' })
            .eq('from_branch_id', b.id),
        ])

        return {
          id: b.id,
          name: b.name,
          current_elders: current.count ?? 0,
          admissions: admissions.count ?? 0,
          deaths: deaths.count ?? 0,
          transfers_in: inRes.count ?? 0,
          transfers_out: outRes.count ?? 0,
        }
      })
    )

    setRows(reportRows)
    setLoading(false)
  }

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <TopBar title="Reports" subtitle="Branch-wise live metrics from centralized records" />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branch Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Branch</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Current Elders</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admissions</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transfers In</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transfers Out</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deaths</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3">{r.current_elders}</td>
                      <td className="px-4 py-3">{r.admissions}</td>
                      <td className="px-4 py-3">{r.transfers_in}</td>
                      <td className="px-4 py-3">{r.transfers_out}</td>
                      <td className="px-4 py-3">{r.deaths}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
