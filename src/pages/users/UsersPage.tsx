import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Profile, UserRole } from '@/types'

interface UserInvite {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'pending' | 'processed' | 'cancelled'
  created_at: string
}

export function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('staff')
  const [saving, setSaving] = useState(false)
  const [invites, setInvites] = useState<UserInvite[]>([])

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    const [profilesRes, invitesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_invites').select('*').order('created_at', { ascending: false }).limit(50),
    ])

    const data = profilesRes.data
    setProfiles((data as Profile[]) ?? [])
    setInvites((invitesRes.data as UserInvite[]) ?? [])
  }

  async function createInvite() {
    setSaving(true)

    const { error } = await supabase.from('user_invites').insert({
      name: name.trim(),
      email: email.trim(),
      role,
      status: 'pending',
    })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success('Invite queued. Process it through Founder secure function.')
    setName('')
    setEmail('')
    setRole('staff')
    setSaving(false)
    fetchProfiles()
  }

  async function updateRole(profileId: string, nextRole: UserRole) {
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', profileId)
    if (error) toast.error(error.message)
    else {
      toast.success('Role updated')
      fetchProfiles()
    }
  }

  async function toggleActive(profile: Profile) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !profile.is_active })
      .eq('id', profile.id)

    if (error) toast.error(error.message)
    else {
      toast.success(profile.is_active ? 'User disabled' : 'User enabled')
      fetchProfiles()
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="User Management" subtitle="Founder-only account administration" />

      <div className="p-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Create User Invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="trustee">Trustee</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={createInvite}
              disabled={saving || !name.trim() || !email.trim()}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Create Invite'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Founder should process pending invites via secure server-side Supabase Admin API.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3">{p.email}</td>
                      <td className="px-4 py-3">
                        <Select value={p.role} onValueChange={(v) => updateRole(p.id, v as UserRole)}>
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="founder">Founder</SelectItem>
                            <SelectItem value="trustee">Trustee</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">{p.is_active ? 'Active' : 'Disabled'}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => toggleActive(p)}>
                          {p.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Recent User Invites</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr key={invite.id} className="border-b">
                      <td className="px-4 py-3">{invite.name}</td>
                      <td className="px-4 py-3">{invite.email}</td>
                      <td className="px-4 py-3 capitalize">{invite.role}</td>
                      <td className="px-4 py-3 capitalize">{invite.status}</td>
                      <td className="px-4 py-3">{new Date(invite.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {invites.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-muted-foreground" colSpan={5}>
                        No invites yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
