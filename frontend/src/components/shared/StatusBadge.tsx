import { Badge } from '@/components/ui/badge'
import type { ElderStatus, UserRole } from '@/types'

interface StatusBadgeProps {
  status: ElderStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<ElderStatus, { label: string; variant: 'success' | 'info' | 'deceased' | 'warning' | 'secondary' | 'default' }> = {
    pending_admission: { label: 'Pending', variant: 'default' },
    active: { label: 'Active', variant: 'success' },
    transferred: { label: 'Transferred', variant: 'info' },
    deceased: { label: 'Deceased', variant: 'deceased' },
    returned_home: { label: 'Returned Home', variant: 'warning' },
    other_outcome: { label: 'Other', variant: 'secondary' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'secondary' }
  return <Badge variant={variant}>{label}</Badge>
}

interface RoleBadgeProps {
  role: UserRole
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const map: Record<UserRole, { label: string; variant: 'default' | 'info' | 'success' }> = {
    founder: { label: 'Founder', variant: 'default' },
    trustee: { label: 'Trustee', variant: 'info' },
    staff: { label: 'Staff', variant: 'success' },
  }
  const { label, variant } = map[role] ?? { label: role, variant: 'default' }
  return <Badge variant={variant}>{label}</Badge>
}
