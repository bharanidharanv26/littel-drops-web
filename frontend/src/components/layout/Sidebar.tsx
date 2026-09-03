import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  ArrowLeftRight,
  UserCog,
  ClipboardList,
  FileBarChart2,
  LogOut,
  Heart,
  ChevronRight,
  ClipboardCheck,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface NavItem {
  label: string
  icon: React.ReactNode
  to: string
  requiredRole?: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    to: '/dashboard',
  },
  {
    label: 'Branches',
    icon: <Building2 size={18} />,
    to: '/branches',
  },
  {
    label: 'Elders',
    icon: <Heart size={18} />,
    to: '/elders',
  },
  {
    label: 'Transfers',
    icon: <ArrowLeftRight size={18} />,
    to: '/transfers',
    requiredRole: ['founder', 'staff'],
  },
  {
    label: 'Requests',
    icon: <ClipboardCheck size={18} />,
    to: '/requests',
    requiredRole: ['founder', 'trustee'],
  },
  {
    label: 'Reports',
    icon: <FileBarChart2 size={18} />,
    to: '/reports',
  },
  {
    label: 'Users',
    icon: <UserCog size={18} />,
    to: '/users',
    requiredRole: ['founder'],
  },
  {
    label: 'Import',
    icon: <Upload size={18} />,
    to: '/import',
    requiredRole: ['founder'],
  },
  {
    label: 'Audit Log',
    icon: <ClipboardList size={18} />,
    to: '/audit-log',
    requiredRole: ['founder', 'trustee'],
  },
]

export function Sidebar() {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiredRole || (role && item.requiredRole.includes(role))
  )

  return (
    <aside className="sidebar-gradient flex h-screen w-64 flex-col border-r border-sidebar-border text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Heart size={18} className="text-white" fill="white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Little Drops</p>
          <p className="text-[10px] text-sidebar-foreground/60 leading-tight">Old Age Home</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-primary text-white shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-white text-xs">
              {profile ? getInitials(profile.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{profile?.name ?? 'User'}</p>
            <p className="text-xs capitalize text-sidebar-foreground/60">{role ?? ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
