import { Bell, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { role } = useAuth()

  const roleColor = {
    founder: 'default',
    trustee: 'info',
    staff: 'success',
  } as const

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {role && (
          <Badge variant={roleColor[role] ?? 'secondary'} className="capitalize text-xs">
            {role}
          </Badge>
        )}
        <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
