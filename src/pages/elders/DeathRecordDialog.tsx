import { useState } from 'react'
import type { Elder } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface DeathRecordDialogProps {
  elder: Elder
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeathRecordDialog({
  elder,
  open,
  onOpenChange,
  onSuccess,
}: DeathRecordDialogProps) {
  const [deathDate, setDeathDate] = useState(new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)

    const { error } = await supabase.rpc('record_elder_death', {
      p_elder_id: elder.id,
      p_death_date: deathDate,
      p_remarks: remarks.trim() || null,
    })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success('Death recorded successfully')
    setSaving(false)
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Death</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Elder</Label>
            <Input value={`${elder.name} (${elder.admission_number})`} disabled />
          </div>

          <div className="space-y-2">
            <Label>Date of Death *</Label>
            <Input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Remarks (Optional)</Label>
            <Textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional context"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSave} disabled={saving || !deathDate}>
            {saving ? 'Saving...' : 'Confirm Death Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
