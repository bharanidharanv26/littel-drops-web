import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { branchesApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Plus, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { Branch } from '@/types'

export default function BranchesPage() {
  const { isFounder } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBranch, setNewBranch] = useState({ name: '', address: '' })

  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    try {
      const data = await branchesApi.getAll()
      setBranches(data)
    } catch (error) {
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newBranch.name.trim()) return

    try {
      await branchesApi.create({ name: newBranch.name.trim(), address: newBranch.address.trim() })
      toast.success('Branch created successfully')
      setNewBranch({ name: '', address: '' })
      setShowAddForm(false)
      loadBranches()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create branch')
    }
  }

  async function handleToggleStatus(id: string) {
    try {
      await branchesApi.toggleStatus(id)
      toast.success('Branch status updated')
      loadBranches()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update branch')
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
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-gray-600 mt-1">Manage your organization's branches</p>
        </div>
        {isFounder && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Branch Name *</label>
                  <Input
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    placeholder="Enter branch name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Branch</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {branches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No branches created yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Create your first branch to start managing elders</p>
          {isFounder && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Branch
            </Button>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                    {branch.address && (
                      <p className="text-sm text-gray-500">{branch.address}</p>
                    )}
                  </div>
                </div>
                <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                  {branch.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{branch.elder_count || 0} current elders</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/branches/${branch.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  {isFounder && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(branch.id)}
                    >
                      {branch.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
