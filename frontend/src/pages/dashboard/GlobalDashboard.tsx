import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { dashboardApi } from '@/services/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Bell, Users, Heart, User, TrendingUp, ArrowLeftRight, Activity, Building2, Plus, UserPlus, ArrowRight } from 'lucide-react'
import type { DashboardStats } from '@/types'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`${color} rounded-xl p-5 text-white flex-shrink-0 w-[180px] flex items-center justify-between shadow-md`}>
      <div>
        <p className="text-sm font-medium text-white/90">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
        {icon}
      </div>
    </div>
  )
}

export default function GlobalDashboard() {
  const { profile, isFounder } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await dashboardApi.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const s = stats as any
  const hasData = stats && (stats.total_elders > 0 || stats.total_branches > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all Little Drops branches</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white px-4 py-1.5 text-sm font-medium rounded-full">
            {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ''}
          </span>
          <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <Bell size={22} />
          </button>
        </div>
      </div>

      {/* Empty State for Founder */}
      {isFounder && !hasData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center">
              <Building2 size={36} className="text-blue-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Little Drops</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Get started by creating your first branch and adding users. The Founder account has full access to configure the system.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/branches"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Create First Branch
            </Link>
            <Link
              to="/users"
              className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <UserPlus size={18} />
              Add Users
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards - only show if there is data */}
      {hasData && stats && (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          <StatCard title="Total Elders" value={stats.total_elders} icon={<Users size={24} />} color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatCard title="Active Elders" value={stats.active_elders} icon={<Heart size={24} />} color="bg-gradient-to-br from-green-500 to-green-600" />
          <StatCard title="Male" value={s?.male_count || 0} icon={<Users size={24} />} color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <StatCard title="Female" value={s?.female_count || 0} icon={<User size={24} />} color="bg-gradient-to-br from-gray-400 to-gray-500" />
          <StatCard title="Total Admissions" value={s?.total_admissions || 0} icon={<TrendingUp size={24} />} color="bg-gradient-to-br from-purple-500 to-purple-600" />
          <StatCard title="Total Transfers" value={s?.total_transfers || 0} icon={<ArrowLeftRight size={24} />} color="bg-gradient-to-br from-amber-500 to-amber-600" />
          <StatCard title="Total Deaths" value={s?.total_deaths || 0} icon={<Activity size={24} />} color="bg-gradient-to-br from-red-500 to-red-600" />
          <StatCard title="Branches" value={stats.total_branches} icon={<Building2 size={24} />} color="bg-gradient-to-br from-teal-500 to-teal-600" />
        </div>
      )}

      {/* Branch Summary Table - only show if branches exist */}
      {stats?.branchStats && stats.branchStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Branch Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-6 py-3.5 text-sm font-semibold text-gray-500">Branch</th>
                  <th className="text-center px-6 py-3.5 text-sm font-semibold text-gray-500">Current Elders</th>
                  <th className="text-center px-6 py-3.5 text-sm font-semibold text-gray-500">Admissions</th>
                  <th className="text-center px-6 py-3.5 text-sm font-semibold text-gray-500">Transfers In</th>
                  <th className="text-center px-6 py-3.5 text-sm font-semibold text-gray-500">Transfers Out</th>
                  <th className="text-center px-6 py-3.5 text-sm font-semibold text-gray-500">Deaths</th>
                </tr>
              </thead>
              <tbody>
                {stats.branchStats.map((branch, index) => (
                  <tr key={branch.id} className={`border-b border-gray-100 last:border-b-0 hover:bg-blue-50/40 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{branch.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600 text-center">{branch.current}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 text-center">{branch.admissions}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600 text-center">{branch.transfers_in}</td>
                    <td className="px-6 py-4 text-sm font-medium text-orange-500 text-center">{branch.transfers_out}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-500 text-center">{branch.deaths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
