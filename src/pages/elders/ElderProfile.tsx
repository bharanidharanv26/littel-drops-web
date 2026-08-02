import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  ArrowLeftRight,
  Heart,
  Phone,
  MapPin,
  Calendar,
  User,
  Building2,
  Stethoscope,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/TopBar'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { Elder, Transfer, Death } from '@/types'
import { DeathRecordDialog } from './DeathRecordDialog'

export function ElderProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite, isFounder } = useAuth()

  const [elder, setElder] = useState<Elder | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [death, setDeath] = useState<Death | null>(null)
  const [loading, setLoading] = useState(true)
  const [deathDialogOpen, setDeathDialogOpen] = useState(false)

  useEffect(() => {
    if (id) fetchAll(id)
  }, [id])

  async function fetchAll(elderId: string) {
    setLoading(true)
    const [elderRes, transfersRes, deathRes] = await Promise.all([
      supabase
        .from('elders')
        .select(`
          *,
          current_branch:branches!current_branch_id(id, name, location),
          admission_branch:branches!admission_branch_id(id, name, location)
        `)
        .eq('id', elderId)
        .single(),
      supabase
        .from('transfers')
        .select(`
          *,
          from_branch:branches!from_branch_id(id, name),
          to_branch:branches!to_branch_id(id, name),
          transferred_by_profile:profiles!transferred_by(name)
        `)
        .eq('elder_id', elderId)
        .order('transfer_date', { ascending: true }),
      supabase
        .from('deaths')
        .select(`*, branch:branches!branch_id(name), recorded_by_profile:profiles!recorded_by(name)`)
        .eq('elder_id', elderId)
        .maybeSingle(),
    ])
    setElder(elderRes.data as Elder)
    setTransfers((transfersRes.data as Transfer[]) ?? [])
    setDeath(deathRes.data as Death)
    setLoading(false)
  }

  if (loading) return <PageLoader />
  if (!elder) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle size={18} />
          <span>Elder not found.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <TopBar title={elder.name} subtitle={`ID: ${elder.admission_number}`} />
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
            <ArrowLeft size={16} />
            Back
          </Button>
          <div className="flex gap-2">
            {canWrite && (
              <Link to={`/elders/${elder.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil size={14} />
                  Edit
                </Button>
              </Link>
            )}
            {canWrite && elder.status === 'active' && (
              <Link to={`/transfers?elder=${elder.id}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeftRight size={14} />
                  Transfer
                </Button>
              </Link>
            )}
            {(canWrite || isFounder) && elder.status === 'active' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeathDialogOpen(true)}
              >
                <Heart size={14} />
                Record Death
              </Button>
            )}
          </div>
        </div>

        {/* Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarImage src={elder.photo_url ?? ''} alt={elder.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {getInitials(elder.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">{elder.name}</h2>
                    <p className="text-sm text-muted-foreground font-mono mt-0.5">
                      {elder.admission_number}
                    </p>
                  </div>
                  <StatusBadge status={elder.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User size={13} />
                    {elder.age} years • <span className="capitalize">{elder.gender}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} />
                    Current: <strong className="text-foreground">{elder.current_branch?.name}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    Admitted: {formatDate(elder.admission_date)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={<Phone size={14} />} label="Phone" value={elder.phone} />
              <InfoRow icon={<MapPin size={14} />} label="Address" value={elder.address} />
              {elder.date_of_birth && (
                <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={formatDate(elder.date_of_birth)} />
              )}
              <InfoRow icon={<User size={14} />} label="Emergency Contact" value={elder.emergency_contact_name} />
              <InfoRow icon={<Phone size={14} />} label="Emergency Phone" value={elder.emergency_contact_phone} />
            </CardContent>
          </Card>

          {/* Admission Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Admission Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={<Building2 size={14} />} label="Admission Branch" value={elder.admission_branch?.name} />
              <InfoRow icon={<Calendar size={14} />} label="Admission Date" value={formatDate(elder.admission_date)} />
              <InfoRow icon={<User size={14} />} label="Admission Number" value={elder.admission_number} mono />
            </CardContent>
          </Card>
        </div>

        {/* Medical Notes */}
        {elder.medical_notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Stethoscope size={14} />
                Medical Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">{elder.medical_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Transfer Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Transfer Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Admission event */}
              <TimelineEvent
                date={elder.admission_date}
                label="Admission"
                description={`Admitted at ${elder.admission_branch?.name}`}
                type="admission"
              />
              {transfers.map((t) => (
                <TimelineEvent
                  key={t.id}
                  date={t.transfer_date}
                  label="Transfer"
                  description={`${t.from_branch?.name} → ${t.to_branch?.name}`}
                  subtext={t.reason ?? undefined}
                  type="transfer"
                />
              ))}
              {death && (
                <TimelineEvent
                  date={death.death_date}
                  label="Death"
                  description={`Passed away at ${(death as unknown as { branch?: { name?: string } }).branch?.name}`}
                  subtext={death.remarks ?? undefined}
                  type="death"
                  isLast
                />
              )}
              {!death && transfers.length === 0 && (
                <p className="text-sm text-muted-foreground pl-8">
                  No transfers recorded. Currently at {elder.current_branch?.name}.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Death Record */}
        {death && (
          <Card className="border-red-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-red-600">
                Death Record
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={<Calendar size={14} />} label="Date of Death" value={formatDate(death.death_date)} />
              <InfoRow
                icon={<Building2 size={14} />}
                label="Branch"
                value={(death as unknown as { branch?: { name?: string } }).branch?.name}
              />
              {death.remarks && (
                <InfoRow icon={<AlertCircle size={14} />} label="Remarks" value={death.remarks} />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {elder.status === 'active' && (
        <DeathRecordDialog
          elder={elder}
          open={deathDialogOpen}
          onOpenChange={setDeathDialogOpen}
          onSuccess={() => fetchAll(elder.id)}
        />
      )}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className={`font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</span>
      </div>
    </div>
  )
}

function TimelineEvent({
  date,
  label,
  description,
  subtext,
  type,
  isLast = false,
}: {
  date: string
  label: string
  description: string
  subtext?: string
  type: 'admission' | 'transfer' | 'death'
  isLast?: boolean
}) {
  const color = {
    admission: 'bg-blue-500',
    transfer: 'bg-amber-500',
    death: 'bg-red-500',
  }[type]

  const textColor = {
    admission: 'text-blue-600',
    transfer: 'text-amber-600',
    death: 'text-red-600',
  }[type]

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <div className="absolute left-[11px] top-5 bottom-0 w-0.5 bg-border" />
      )}
      <div className={`relative mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${color}`}>
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-xs font-semibold uppercase tracking-wide ${textColor}`}>{label}</span>
          <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
        </div>
        <p className="text-sm font-medium mt-0.5">{description}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}
