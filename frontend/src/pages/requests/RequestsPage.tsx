import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { requestsApi, eldersApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Request, RequestStatus } from '@/types'
import { format } from 'date-fns'

const statusColors: Record<RequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function RequestsPage() {
  const { isFounder, isTrustee, isStaff } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reviewComment, setReviewComment] = useState('')
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [statusFilter])

  async function loadRequests() {
    setLoading(true)
    try {
      const result = await requestsApi.getAll({
        status: statusFilter || undefined,
      })
      setRequests(result.data || [])
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(id: string, action: 'approve' | 'reject') {
    try {
      await requestsApi.review(id, {
        action,
        reviewComment: reviewComment || undefined,
      })
      toast.success(`Request ${action}d successfully`)
      setReviewingId(null)
      setReviewComment('')
      loadRequests()
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} request`)
    }
  }

  async function handleCancel(id: string) {
    try {
      await eldersApi.cancelRequest(id)
      toast.success('Request cancelled')
      loadRequests()
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel request')
    }
  }

  function getRequestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      admission: 'Admission',
      edit: 'Edit',
      transfer: 'Transfer',
      death: 'Death',
      return_home: 'Return Home',
      other: 'Other',
    }
    return labels[type] || type
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
        <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        <p className="text-gray-600 mt-1">
          {isStaff ? 'Your submitted requests' : 'Review and manage requests'}
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'cancelled', 'all'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={ClipboardCheck}
              title="No requests"
              description="No requests found for the selected filter."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getRequestTypeLabel(request.requestType)}</Badge>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {request.elder?.name && (
                        <span className="font-medium">{request.elder.name}</span>
                      )}
                      {request.branch && (
                        <span className="text-gray-500"> — {request.branch.name}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted by: {request.requested_by?.name || '—'}
                      {request.reviewed_by && ` | Reviewed by: ${request.reviewed_by.name}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                    {request.reviewComment && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{request.reviewComment}"</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  {(isFounder || isTrustee) && request.status === 'pending' && (
                    <div className="flex gap-2">
                      {reviewingId === request.id ? (
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="Review comment (optional)"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="h-8 text-sm"
                          />
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleReview(request.id, 'approve')}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReview(request.id, 'reject')}>
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setReviewingId(null); setReviewComment(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setReviewingId(request.id)}>
                          Review
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Staff can cancel their own pending requests */}
                  {isStaff && request.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => handleCancel(request.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
