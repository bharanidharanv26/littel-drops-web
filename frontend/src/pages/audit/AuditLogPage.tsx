import { useEffect, useState } from 'react'
import { auditApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ClipboardList } from 'lucide-react'
import type { AuditLog } from '@/types'
import { format } from 'date-fns'

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadLogs()
  }, [dateFrom, dateTo])

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await auditApi.getAll({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setLogs(data || [])
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Track all system activities and changes</p>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No audit logs"
              description="No audit log entries found for the selected period."
            />
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {log.entityType}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                          {log.actorRole}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Actor: {typeof log.actorId === 'object' ? (log.actorId as any).name : log.actorId}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-gray-500 mt-1">Reason: {log.reason}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
