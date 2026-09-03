import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { eldersApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ArrowLeftRight } from 'lucide-react'
import type { ElderMovement, Branch } from '@/types'
import { format } from 'date-fns'
import { dashboardApi } from '@/services/api'

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransfers()
  }, [])

  async function loadTransfers() {
    try {
      const data = await dashboardApi.getReports({ report_type: 'transfers' })
      setTransfers(data || [])
    } catch (error) {
      console.error('Failed to load transfers:', error)
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
        <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
        <p className="text-gray-600 mt-1">Elder transfer history across branches</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {transfers.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transfers yet"
              description="Transfer records will appear here once elders are moved between branches."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Elder</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">From</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">To</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium">{t.elder?.name || '—'}</td>
                      <td className="p-3 text-sm">{t.from_branch?.name || '—'}</td>
                      <td className="p-3 text-sm">{t.to_branch?.name || '—'}</td>
                      <td className="p-3 text-sm">
                        {t.movementDate ? format(new Date(t.movementDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="p-3 text-sm text-gray-500">{t.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
