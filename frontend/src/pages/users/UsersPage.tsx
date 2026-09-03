import { useEffect, useState } from 'react'
import { usersApi, branchesApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Plus, UserCog, Shield, User, Edit, Trash2, Key } from 'lucide-react'
import { toast } from 'sonner'
import type { User as UserType, Branch, UserRole } from '@/types'

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState<string | null>(null)
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff' as UserRole,
    phone: '',
    email: '',
    branchId: '',
    assignmentType: 'permanent' as 'permanent' | 'trustee' | 'temporary',
  })
  const [assignData, setAssignData] = useState({
    branchId: '',
    assignmentType: 'permanent' as 'permanent' | 'trustee' | 'temporary',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [usersData, branchesData] = await Promise.all([
        usersApi.getAll(),
        branchesApi.getAll(),
      ])
      setUsers(usersData)
      setBranches(branchesData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    try {
      await usersApi.create(newUser)
      toast.success('User created successfully')
      setShowCreateForm(false)
      setNewUser({ name: '', username: '', password: '', role: 'staff', phone: '', email: '', branchId: '', assignmentType: 'permanent' })
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    }
  }

  async function handleToggleStatus(id: string) {
    try {
      await usersApi.toggleStatus(id)
      toast.success('User status updated')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!showResetPassword || !newPassword) return
    try {
      await usersApi.resetPassword(showResetPassword, newPassword)
      toast.success('Password reset successfully')
      setShowResetPassword(null)
      setNewPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
    }
  }

  async function handleAssignBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!showAssignForm || !assignData.branchId) return
    try {
      await usersApi.createAssignment({
        userId: showAssignForm,
        branchId: assignData.branchId,
        assignmentType: assignData.assignmentType,
      })
      toast.success('Branch assigned successfully')
      setShowAssignForm(null)
      setAssignData({ branchId: '', assignmentType: 'permanent' })
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign branch')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage staff and trustee accounts</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Username *</label>
                  <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <select className="w-full h-10 px-3 border rounded-md text-sm" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })} required>
                    <option value="staff">Staff</option>
                    <option value="trustee">Trustee</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Branch</label>
                  <select className="w-full h-10 px-3 border rounded-md text-sm" value={newUser.branchId} onChange={(e) => setNewUser({ ...newUser, branchId: e.target.value })}>
                    <option value="">No branch</option>
                    {branches.filter(b => b.isActive).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Assignment Type</label>
                  <select className="w-full h-10 px-3 border rounded-md text-sm" value={newUser.assignmentType} onChange={(e) => setNewUser({ ...newUser, assignmentType: e.target.value as any })}>
                    <option value="permanent">Permanent (Staff)</option>
                    <option value="trustee">Trustee Branch</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create User</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Username</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Role</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{user.name}</td>
                  <td className="p-3 text-sm text-gray-600">{user.username}</td>
                  <td className="p-3">
                    <Badge variant={user.role === 'founder' ? 'default' : user.role === 'trustee' ? 'secondary' : 'outline'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {user.role !== 'founder' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setShowAssignForm(user.id)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowResetPassword(user.id)}>
                            <Key className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleToggleStatus(user.id)}>
                            {user.isActive ? 'Disable' : 'Enable'}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Assign Branch Dialog */}
      {showAssignForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Assign Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignBranch} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Branch</label>
                  <select className="w-full h-10 px-3 border rounded-md text-sm mt-1" value={assignData.branchId} onChange={(e) => setAssignData({ ...assignData, branchId: e.target.value })} required>
                    <option value="">Select branch</option>
                    {branches.filter(b => b.isActive).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Assignment Type</label>
                  <select className="w-full h-10 px-3 border rounded-md text-sm mt-1" value={assignData.assignmentType} onChange={(e) => setAssignData({ ...assignData, assignmentType: e.target.value as any })}>
                    <option value="permanent">Permanent</option>
                    <option value="trustee">Trustee</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Assign</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAssignForm(null)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Password Dialog */}
      {showResetPassword && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={4} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Reset Password</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowResetPassword(null); setNewPassword(''); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
