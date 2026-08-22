import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { role, profile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const roleColor = {
    founder: 'default',
    trustee: 'info',
    staff: 'success',
  } as const

  useEffect(() => {
    if (!profile) return
    async function fetchCount() {
      const { data } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', profile!.id)
        .eq('is_read', false)
      setUnreadCount(data?.length ?? 0)
    }
    fetchCount()
  }, [profile])

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
        <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
