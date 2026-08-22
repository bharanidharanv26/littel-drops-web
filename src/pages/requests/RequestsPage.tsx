import { useEffect, useState } from 'react'
import { ClipboardCheck, Check, X, Clock, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import type { Request } from '@/types'

type RequestStatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'

export function RequestsPage() {
  const { user, isFounder, isTrustee } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('pending')
  const [reviewDialog, setReviewDialog] = useState<Request | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  async function fetchRequests() {
    setLoading(true)
    let query = supabase
      .from('requests')
      .select(`
        *,
        elder:elders!elder_id(name, admission_number, id),
        from_branch:branches!from_branch_id(name, id),
        to_branch:branches!to_branch_id(name, id),
        submitted_by_profile:profiles!submitted_by(name),
        reviewed_by_profile:profiles!reviewed_by(name)
      `)
      .order('submitted_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setRequests((data as Request[]) ?? [])
    setLoading(false)
  }

  async function handleDecision(status: 'approved' | 'rejected') {
    if (!reviewDialog || !user) return
    setSaving(true)

    const { error } = await supabase
      .from('requests')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        decision_reason: decisionReason.trim() || null,
      })
      .eq('id', reviewDialog.id)

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    // If approved, execute the underlying action
    if (status === 'approved' && reviewDialog.request_type === 'transfer' && reviewDialog.elder_id) {
      const payload = reviewDialog.payload as Record<string, unknown> | null
      if (payload?.to_branch_id) {
        await supabase.rpc('transfer_elder', {
          p_elder_id: reviewDialog.elder_id,
          p_to_branch_id: payload.to_branch_id,
          p_transfer_date: reviewDialog.submitted_at.slice(0, 10),
          p_reason: payload.reason ?? null,
        })
      }
    }

    if (status === 'approved' && reviewDialog.request_type === 'death' && reviewDialog.elder_id) {
      await supabase.rpc('record_elder_death', {
        p_elder_id: reviewDialog.elder_id,
        p_death_date: reviewDialog.submitted_at.slice(0, 10),
        p_remarks: (reviewDialog.payload as Record<string, unknown>)?.remarks ?? null,
      })
    }

    // Audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `${status.toUpperCase()}_REQUEST`,
      entity_type: 'request',
      entity_id: reviewDialog.id,
      details: {
        request_type: reviewDialog.request_type,
        elder_id: reviewDialog.elder_id,
        decision_reason: decisionReason.trim() || null,
      },
    })

    // Notify the requester
    await supabase.from('notifications').insert({
      user_id: reviewDialog.submitted_by,
      title: `Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your ${reviewDialog.request_type} request for ${(reviewDialog as any).elder?.name ?? 'an elder'} has been ${status}.`,
      entity_type: 'request',
      entity_id: reviewDialog.id,
    })

    toast.success(`Request ${status}`)
    setSaving(false)
    setReviewDialog(null)
    setDecisionReason('')
    fetchRequests()
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'success' | 'warning' | 'info'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'destructive',
      cancelled: 'secondary',
    }
    return <Badge variant={variants[status] ?? 'secondary'}>{status}</Badge>
  }

  function getRequestTypeLabel(type: string) {
    const labels: Record<string, string> = {
      admission: 'Admission',
      transfer: 'Transfer',
      death: 'Death Record',
      return_home: 'Return Home',
      other: 'Other Outcome',
      edit: 'Edit Request',
    }
    return labels[type] ?? type
  }

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <TopBar title="Requests" subtitle="Review and approve staff submissions" />

      <div className="p-6 space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RequestStatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{requests.length} requests</span>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No requests found"
            description={statusFilter === 'pending' ? 'No pending requests to review.' : 'No requests match your filter.'}
          />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{getRequestTypeLabel(req.request_type)}</Badge>
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="mt-2 text-sm font-medium">
                        {(req as any).elder?.name ?? 'Unknown Elder'}
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          ({(req as any).elder?.admission_number ?? 'N/A'})
                        </span>
                      </p>
                      {req.from_branch && req.to_branch && (
                        <p className="text-sm text-muted-foreground">
                          {(req.from_branch as any).name} → {(req.to_branch as any).name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Submitted: {formatDateTime(req.submitted_at)}
                        </span>
                        <span>by {(req as any).submitted_by_profile?.name ?? 'Unknown'}</span>
                      </div>
                      {req.reviewed_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reviewed: {formatDateTime(req.reviewed_at)}
                          {(req as any).reviewed_by_profile?.name && ` by ${(req as any).reviewed_by_profile.name}`}
                        </p>
                      )}
                      {req.decision_reason && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          Reason: {req.decision_reason}
                        </p>
                      )}
                    </div>
                    {req.status === 'pending' && (isFounder || isTrustee) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setReviewDialog(req); setDecisionReason('') }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(open) => { if (!open) setReviewDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm font-medium">
                {getRequestTypeLabel(reviewDialog?.request_type ?? '')}
              </p>
              <p className="text-sm text-muted-foreground">
                Elder: {(reviewDialog as any)?.elder?.name ?? 'Unknown'}
              </p>
              {reviewDialog?.from_branch && reviewDialog?.to_branch && (
                <p className="text-sm text-muted-foreground">
                  {(reviewDialog.from_branch as any).name} → {(reviewDialog.to_branch as any).name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Decision Reason (Optional)</Label>
              <Textarea
                rows={3}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Optional reason for your decision..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDecision('rejected')}
              disabled={saving}
            >
              <X size={14} />
              {saving ? 'Saving...' : 'Reject'}
            </Button>
            <Button
              onClick={() => handleDecision('approved')}
              disabled={saving}
            >
              <Check size={14} />
              {saving ? 'Saving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
