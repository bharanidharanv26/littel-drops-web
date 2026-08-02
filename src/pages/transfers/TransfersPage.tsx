import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Branch, Elder } from '@/types'

interface TransferRow {
  id: string
  transfer_date: string
  reason: string | null
  elder: { name: string; admission_number: string } | null
  from_branch: { name: string } | null
  to_branch: { name: string } | null
}

interface TransferQueryRow {
  id: string
  transfer_date: string
  reason: string | null
  elder: { name: string; admission_number: string }[] | null
  from_branch: { name: string }[] | null
  to_branch: { name: string }[] | null
}

export function TransfersPage() {
  const [params] = useSearchParams()

  const [elders, setElders] = useState<Elder[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [history, setHistory] = useState<TransferRow[]>([])
  const [saving, setSaving] = useState(false)

  const [elderId, setElderId] = useState(params.get('elder') ?? '')
  const [toBranchId, setToBranchId] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')

  const selectedElder = useMemo(
    () => elders.find((e) => e.id === elderId) ?? null,
    [elders, elderId]
  )

  const availableTargetBranches = useMemo(() => {
    if (!selectedElder) return branches
    return branches.filter((b) => b.id !== selectedElder.current_branch_id)
  }, [branches, selectedElder])

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [eldersRes, branchesRes, historyRes] = await Promise.all([
      supabase
        .from('elders')
        .select('*, current_branch:branches!current_branch_id(id, name)')
        .eq('status', 'active')
        .order('name'),
      supabase.from('branches').select('*').eq('is_active', true).order('name'),
      supabase
        .from('transfers')
        .select(
          `
          id,
          transfer_date,
          reason,
          elder:elders!elder_id(name, admission_number),
          from_branch:branches!from_branch_id(name),
          to_branch:branches!to_branch_id(name)
        `
        )
        .order('transfer_date', { ascending: false })
        .limit(20),
    ])

    setElders((eldersRes.data as Elder[]) ?? [])
    setBranches((branchesRes.data as Branch[]) ?? [])
    const normalized = ((historyRes.data as TransferQueryRow[]) ?? []).map((row) => ({
      id: row.id,
      transfer_date: row.transfer_date,
      reason: row.reason,
      elder: row.elder?.[0] ?? null,
      from_branch: row.from_branch?.[0] ?? null,
      to_branch: row.to_branch?.[0] ?? null,
    }))

    setHistory(normalized)
  }

  async function handleTransfer() {
    if (!selectedElder) return
    if (!toBranchId) return

    setSaving(true)

    const { error } = await supabase.rpc('transfer_elder', {
      p_elder_id: selectedElder.id,
      p_to_branch_id: toBranchId,
      p_transfer_date: transferDate,
      p_reason: reason.trim() || null,
    })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success('Transfer recorded successfully')
    setToBranchId('')
    setReason('')
    setSaving(false)
    fetchAll()
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Transfers" subtitle="Move elders between branches with permanent history" />

      <div className="p-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record New Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Elder *</Label>
              <Select value={elderId} onValueChange={setElderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select elder" />
                </SelectTrigger>
                <SelectContent>
                  {elders.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Branch</Label>
              <Input
                disabled
                value={selectedElder?.current_branch?.name ?? ''}
                placeholder="Auto from selected elder"
              />
            </div>

            <div className="space-y-2">
              <Label>To Branch *</Label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargetBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transfer Date *</Label>
              <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for transfer"
              />
            </div>

            <Button
              onClick={handleTransfer}
              disabled={saving || !selectedElder || !toBranchId || !transferDate}
              className="w-full"
            >
              <ArrowLeftRight size={16} />
              {saving ? 'Saving...' : 'Transfer Elder'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground">No transfer history available.</p>
            )}
            {history.map((row) => (
              <div key={row.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">
                  {row.elder?.name ?? 'Unknown'} ({row.elder?.admission_number ?? 'N/A'})
                </p>
                <p className="text-sm text-muted-foreground">
                  {row.from_branch?.name ?? 'Unknown'} -&gt; {row.to_branch?.name ?? 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {row.transfer_date}
                  {row.reason ? ` - ${row.reason}` : ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
