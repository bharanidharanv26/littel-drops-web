import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  gradient?: string
  description?: string
  loading?: boolean
  className?: string
}

export function StatCard({ title, value, icon: Icon, gradient, description, loading, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden border-0 shadow-md', className)}>
      <CardContent className="p-0">
        <div className={cn('flex items-center justify-between p-5 text-white', gradient || 'bg-gray-600')}>
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            {loading ? (
              <div className="mt-1 h-8 w-16 animate-pulse rounded bg-white/20" />
            ) : (
              <p className="mt-1 text-3xl font-bold">{value}</p>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-white/70">{description}</p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Icon size={22} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
