import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { eldersApi, branchesApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TopBar } from '@/components/layout/TopBar'
import { Search, Plus, Eye, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import type { Elder, Branch, ElderStatus } from '@/types'
import { formatDate } from '@/lib/utils'

export default function ElderList() {
  const [elders, setElders] = useState<Elder[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    loadElders()
  }, [branchFilter, statusFilter, currentPage])

  async function loadBranches() {
    try {
      const data = await branchesApi.getAll()
      setBranches(data)
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  async function loadElders() {
    try {
      setLoading(true)
      const result = await eldersApi.getAll({
        branch_id: branchFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
        page: currentPage,
        limit,
      })
      setElders(result.data || [])
      setTotalCount(result.total || 0)
      setTotalPages(result.pages || 1)
    } catch (error) {
      console.error('Failed to load elders:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setCurrentPage(1)
    loadElders()
  }

  function getElderId(elder: Elder): string {
    return elder.id || elder._id || ''
  }

  function getBranchName(elder: Elder): string {
    if (elder.current_branch && typeof elder.current_branch === 'object') {
      return (elder.current_branch as Branch).name
    }
    if (elder.currentBranch && typeof elder.currentBranch === 'object') {
      return (elder.currentBranch as Branch).name
    }
    return '—'
  }

  const startItem = totalCount > 0 ? (currentPage - 1) * limit + 1 : 0
  const endItem = Math.min(currentPage * limit, totalCount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <TopBar
        title="Elders"
        subtitle="All elder records across all branches"
        showRole={true}
      />

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-[400px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 h-11"
            placeholder="Search by name, admission no., phone, branch, ID."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
          />
        </div>
        <select
          className="h-11 px-4 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={branchFilter}
          onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          className="h-11 px-4 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending_admission">Pending Admission</option>
          <option value="transferred">Transferred</option>
          <option value="deceased">Deceased</option>
          <option value="returned_home">Returned Home</option>
          <option value="other_outcome">Other Outcome</option>
        </select>
        <Link to="/elders/new">
          <Button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium">
            <Plus className="h-4 w-4 mr-2" />
            Add Elder
          </Button>
        </Link>
      </div>

      {/* Elder Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Adm. No.</th>
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Age</th>
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Gender</th>
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Current Branch</th>
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Adm. Date</th>
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3.5 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {elders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No elder records found</p>
                        <p className="text-gray-400 text-sm mt-1">Add your first elder to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  elders.map((elder, index) => (
                    <tr key={getElderId(elder)} className={`border-b last:border-b-0 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 text-sm text-gray-600">{elder.admissionNumber || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{elder.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{elder.age}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{elder.gender}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getBranchName(elder)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(elder.admissionDate)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={elder.currentStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/elders/${getElderId(elder)}`}>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Showing {startItem}–{endItem} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
