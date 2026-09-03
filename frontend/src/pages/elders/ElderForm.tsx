import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { eldersApi, branchesApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import type { Branch, Elder } from '@/types'

export default function ElderForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isFounder, isStaff, profile } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(!!id)
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dateOfBirth: '',
    admissionNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    admissionTime: '',
    admissionBranch: '',
    policeMemoNumber: '',
    referredBy: '',
    address: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
    photoUrl: '',
  })

  useEffect(() => {
    loadBranches()
    if (id) loadElder()
  }, [id])

  async function loadBranches() {
    try {
      const data = await branchesApi.getAll()
      setBranches(data)
    } catch (error) {
      toast.error('Failed to load branches')
    }
  }

  async function loadElder() {
    try {
      const data = await eldersApi.getById(id!)
      setForm({
        name: data.name || '',
        age: data.age?.toString() || '',
        gender: data.gender || 'male',
        dateOfBirth: data.dateOfBirth || '',
        admissionNumber: data.admissionNumber || '',
        admissionDate: data.admissionDate || '',
        admissionTime: data.admissionTime || '',
        admissionBranch: typeof data.admissionBranch === 'object' ? data.admissionBranch._id : data.admissionBranch || '',
        policeMemoNumber: data.policeMemoNumber || '',
        referredBy: data.referredBy || '',
        address: data.address || '',
        phone: data.phone || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        medicalNotes: data.medicalNotes || '',
        photoUrl: data.photoUrl || '',
      })
    } catch (error) {
      toast.error('Failed to load elder')
      navigate('/elders')
    } finally {
      setInitialLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.age || !form.admissionBranch) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (isEdit && id) {
        // Staff submits edit request, Trustee/Founder edits directly
        await eldersApi.editElder(id, {
          name: form.name,
          age: parseInt(form.age),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth || undefined,
          phone: form.phone,
          address: form.address,
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          medicalNotes: form.medicalNotes || undefined,
          policeMemoNumber: form.policeMemoNumber || undefined,
          referredBy: form.referredBy || undefined,
          photoUrl: form.photoUrl || undefined,
        })
        toast.success(isStaff ? 'Edit request submitted for approval' : 'Elder updated successfully')
      } else {
        // Submit admission request
        await eldersApi.submitAdmission({
          name: form.name,
          age: parseInt(form.age),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth || undefined,
          admissionNumber: form.admissionNumber || undefined,
          admissionDate: form.admissionDate,
          admissionTime: form.admissionTime || undefined,
          admissionBranch: form.admissionBranch,
          policeMemoNumber: form.policeMemoNumber || undefined,
          referredBy: form.referredBy || undefined,
          address: form.address,
          phone: form.phone,
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          medicalNotes: form.medicalNotes || undefined,
          photoUrl: form.photoUrl || undefined,
        })
        toast.success('Admission request submitted for approval')
      }
      navigate('/elders')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Elder' : 'New Admission'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update elder information' : 'Submit a new admission request'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="150"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  className="w-full h-10 px-3 border rounded-md text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Admission Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  value={form.admissionNumber}
                  onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <Label htmlFor="admissionDate">Admission Date *</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={form.admissionDate}
                  onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="admissionBranch">Admission Branch *</Label>
                <select
                  id="admissionBranch"
                  className="w-full h-10 px-3 border rounded-md text-sm"
                  value={form.admissionBranch}
                  onChange={(e) => setForm({ ...form, admissionBranch: e.target.value })}
                  required
                >
                  <option value="">Select branch</option>
                  {branches.filter(b => b.isActive).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="policeMemoNumber">Police Memo Number</Label>
                <Input
                  id="policeMemoNumber"
                  value={form.policeMemoNumber}
                  onChange={(e) => setForm({ ...form, policeMemoNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="referredBy">Referred By</Label>
                <Input
                  id="referredBy"
                  value={form.referredBy}
                  onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicalNotes">Medical Notes</Label>
                <Input
                  id="medicalNotes"
                  value={form.medicalNotes}
                  onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={form.emergencyContactName}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={form.emergencyContactPhone}
                  onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : isEdit ? 'Update Elder' : 'Submit Admission'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/elders')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
