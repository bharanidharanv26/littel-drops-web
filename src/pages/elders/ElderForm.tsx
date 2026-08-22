import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { TopBar } from '@/components/layout/TopBar'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Branch, Elder, ElderGender } from '@/types'

interface ElderFormProps {
  mode: 'create' | 'edit'
}

export function ElderForm({ mode }: ElderFormProps) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male' as ElderGender,
    date_of_birth: '',
    police_memo_number: '',
    referred_by: '',
    address: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    admission_branch_id: '',
    admission_number: '',
    admission_date: new Date().toISOString().split('T')[0],
    photo_url: '',
  })

  useEffect(() => {
    supabase.from('branches').select('*').eq('is_active', true).order('name').then(({ data }) => {
      setBranches((data as Branch[]) ?? [])
    })
  }, [])

  useEffect(() => {
    if (mode === 'edit' && id) {
      supabase.from('elders').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          const e = data as Elder
          setForm({
            name: e.name,
            age: String(e.age),
            gender: e.gender,
            date_of_birth: e.date_of_birth ?? '',
            police_memo_number: e.police_memo_number ?? '',
            referred_by: e.referred_by ?? '',
            address: e.address,
            phone: e.phone,
            emergency_contact_name: e.emergency_contact_name,
            emergency_contact_phone: e.emergency_contact_phone,
            medical_notes: e.medical_notes ?? '',
            admission_branch_id: e.admission_branch_id,
            admission_number: e.admission_number,
            admission_date: e.admission_date,
            photo_url: e.photo_url ?? '',
          })
          if (e.photo_url) setPhotoPreview(e.photo_url)
        }
        setLoading(false)
      })
    }
  }, [mode, id])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let photoUrl = form.photo_url

    // Upload photo if changed
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `elders/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('elder-photos')
        .upload(path, photoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('elder-photos').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
    }

    if (mode === 'create') {
      // Check admission number uniqueness
      const admissionNum = form.admission_number.trim()
      if (!admissionNum) {
        toast.error('Admission number is required')
        setSaving(false)
        return
      }
      const { data: existing } = await supabase
        .from('elders')
        .select('id')
        .eq('admission_number', admissionNum)
      if (existing && existing.length > 0) {
        toast.error('Admission number already exists')
        setSaving(false)
        return
      }

      const { data: newElder, error } = await supabase
        .from('elders')
        .insert({
          name: form.name.trim(),
          age: parseInt(form.age),
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
          police_memo_number: form.police_memo_number.trim() || null,
          referred_by: form.referred_by.trim() || null,
          address: form.address.trim(),
          phone: form.phone.trim(),
          emergency_contact_name: form.emergency_contact_name.trim(),
          emergency_contact_phone: form.emergency_contact_phone.trim(),
          medical_notes: form.medical_notes.trim() || null,
          admission_branch_id: form.admission_branch_id,
          current_branch_id: form.admission_branch_id,
          admission_date: form.admission_date,
          admission_number: admissionNum,
          status: 'active',
          photo_url: photoUrl || null,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }

      // Log
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'CREATE_ELDER',
        entity_type: 'elder',
        entity_id: newElder.id,
        details: { name: form.name, admission_number: admissionNum },
      })

      toast.success(`Elder admitted successfully! Admission No: ${admissionNum}`)
      navigate(`/elders/${newElder.id}`)
    } else {
      const { error } = await supabase
        .from('elders')
        .update({
          name: form.name.trim(),
          age: parseInt(form.age),
          gender: form.gender,
          date_of_birth: form.date_of_birth || null,
          police_memo_number: form.police_memo_number.trim() || null,
          referred_by: form.referred_by.trim() || null,
          address: form.address.trim(),
          phone: form.phone.trim(),
          emergency_contact_name: form.emergency_contact_name.trim(),
          emergency_contact_phone: form.emergency_contact_phone.trim(),
          medical_notes: form.medical_notes.trim() || null,
          photo_url: photoUrl || null,
        })
        .eq('id', id!)

      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'EDIT_ELDER',
        entity_type: 'elder',
        entity_id: id,
        details: { name: form.name },
      })

      toast.success('Elder details updated')
      navigate(`/elders/${id}`)
    }

    setSaving(false)
  }

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <TopBar
        title={mode === 'create' ? 'Admit New Elder' : 'Edit Elder Details'}
        subtitle={mode === 'create' ? 'Register a new elder into the system' : 'Update elder information'}
      />
      <div className="p-6 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 mb-6">
          <ArrowLeft size={16} />
          Back
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Photograph (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl text-muted-foreground">👤</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
                      <Upload size={14} />
                      Upload Photo
                    </span>
                  </label>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); set('photo_url', '') }}
                    >
                      <X size={14} />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Full Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Age *</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  max="130"
                  value={form.age}
                  onChange={(e) => set('age', e.target.value)}
                  placeholder="e.g. 78"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set('date_of_birth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address *</Label>
                <Textarea
                  required
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Full residential address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact Name *</Label>
                <Input
                  required
                  value={form.emergency_contact_name}
                  onChange={(e) => set('emergency_contact_name', e.target.value)}
                  placeholder="Relative's name"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone *</Label>
                <Input
                  required
                  type="tel"
                  value={form.emergency_contact_phone}
                  onChange={(e) => set('emergency_contact_phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reference & Police */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Reference & Police Memo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Referred By</Label>
                <Input
                  value={form.referred_by}
                  onChange={(e) => set('referred_by', e.target.value)}
                  placeholder="e.g. Self, NGO Partner, Police..."
                />
              </div>
              <div className="space-y-2">
                <Label>Police Memo Number</Label>
                <Input
                  value={form.police_memo_number}
                  onChange={(e) => set('police_memo_number', e.target.value)}
                  placeholder="Police memo / FIR reference"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Medical Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.medical_notes}
                onChange={(e) => set('medical_notes', e.target.value)}
                placeholder="Any known conditions, medications, allergies..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Admission Details (create only) */}
          {mode === 'create' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Admission Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Admission Number *</Label>
                  <Input
                    required
                    value={form.admission_number}
                    onChange={(e) => set('admission_number', e.target.value)}
                    placeholder="e.g. LD-PAR-2026-0001"
                  />
                  <p className="text-xs text-muted-foreground">Must be unique across the organization</p>
                </div>
                <div className="space-y-2">
                  <Label>Admission Branch *</Label>
                  <Select
                    value={form.admission_branch_id}
                    onValueChange={(v) => set('admission_branch_id', v)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admission Date *</Label>
                  <Input
                    required
                    type="date"
                    value={form.admission_date}
                    onChange={(e) => set('admission_date', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none sm:px-8">
              <Save size={16} />
              {saving ? 'Saving...' : mode === 'create' ? 'Admit Elder' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
