import { useState } from 'react'
import { eldersApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface DeathRecordDialogProps {
  open: boolean
  onClose: () => void
  elderId: string
  elderName: string
  onSuccess: () => void
}

export default function DeathRecordDialog({ open, onClose, elderId, elderName, onSuccess }: DeathRecordDialogProps) {
  const [deathDate, setDeathDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deathDate) return

    setLoading(true)
    try {
      await eldersApi.submitDeath({
        elderId,
        deathDate,
        reason: reason || undefined,
      })
      toast.success('Death record submitted for approval')
      onSuccess()
      onClose()
      setDeathDate('')
      setReason('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit death record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Record Death - {elderName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Death Date *</label>
              <input
                type="date"
                className="w-full h-10 px-3 border rounded-md text-sm mt-1"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason / Remarks</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason or remarks"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Death Record'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
