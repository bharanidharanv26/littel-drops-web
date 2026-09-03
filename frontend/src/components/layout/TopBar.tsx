import { Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'

interface TopBarProps {
  title: string
  subtitle?: string
  showRole?: boolean
}

export function TopBar({ title, subtitle, showRole = true }: TopBarProps) {
  const { role, profile } = useAuth()

  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {showRole && role && (
          <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm font-medium rounded-full">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        )}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} />
        </button>
      </div>
    </header>
  )
}
