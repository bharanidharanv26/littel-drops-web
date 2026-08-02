import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, ChevronRight, Plus, Pencil, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import type { Branch } from '@/types'
import { toast } from 'sonner'

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [elderCounts, setElderCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const { isFounder } = useAuth()

  useEffect(() => {
    fetchBranches()
  }, [])

  async function fetchBranches() {
    setLoading(true)
    const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('name')
    const list = (data as Branch[]) ?? []
    setBranches(list)

    const counts: Record<string, number> = {}
    await Promise.all(
      list.map(async (b) => {
        const { count } = await supabase
          .from('elders')
          .select('id', { count: 'exact' })
          .eq('current_branch_id', b.id)
          .eq('status', 'active')
        counts[b.id] = count ?? 0
      })
    )
    setElderCounts(counts)
    setLoading(false)
  }

  function openCreate() {
    setEditBranch(null)
    setName('')
    setLocation('')
    setDialogOpen(true)
  }

  function openEdit(b: Branch) {
    setEditBranch(b)
    setName(b.name)
    setLocation(b.location)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    if (editBranch) {
      const { error } = await supabase
        .from('branches')
        .update({ name: name.trim(), location: location.trim() })
        .eq('id', editBranch.id)
      if (error) toast.error(error.message)
      else toast.success('Branch updated')
    } else {
      const { error } = await supabase
        .from('branches')
        .insert({ name: name.trim(), location: location.trim(), is_active: true })
      if (error) toast.error(error.message)
      else toast.success('Branch created')
    }
    setSaving(false)
    setDialogOpen(false)
    fetchBranches()
  }

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <TopBar title="Branches" subtitle="All Little Drops branch locations" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{branches.length} active branches</p>
          {isFounder && (
            <Button onClick={openCreate}>
              <Plus size={16} />
              Add Branch
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {branches.map((b) => (
            <Card key={b.id} className="group overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="stat-gradient-blue p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <Building2 size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{b.name}</p>
                    <p className="text-xs text-white/70 truncate">{b.location || 'No location set'}</p>
                  </div>
                  {isFounder && (
                    <button
                      onClick={(e) => { e.preventDefault(); openEdit(b) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-white/70 hover:text-white hover:bg-white/20"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={15} className="text-muted-foreground" />
                    <span className="font-semibold">{elderCounts[b.id] ?? 0}</span>
                    <span className="text-muted-foreground">elders</span>
                  </div>
                  <Link to={`/branches/${b.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View
                      <ChevronRight size={13} />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Branch Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chennai" />
            </div>
            <div className="space-y-2">
              <Label>Location / Address</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Anna Nagar, Chennai" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X size={14} /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              <Check size={14} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
