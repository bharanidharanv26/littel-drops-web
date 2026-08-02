import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/types'

type AuditLogRow = Omit<AuditLog, 'user'> & {
  user: { name: string } | null
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('*, user:profiles!user_id(name)')
      .order('created_at', { ascending: false })
      .limit(100)

    setLogs((data as AuditLogRow[]) ?? [])
    setLoading(false)
  }

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <TopBar title="Audit Log" subtitle="Track important system actions" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date & Time</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="px-4 py-3">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-3">{log.user?.name ?? 'System'}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td className="px-4 py-3">{log.entity_type}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.entity_id ?? '-'}</td>
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
