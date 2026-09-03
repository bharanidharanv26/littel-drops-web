import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { eldersApi, branchesApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Edit, ArrowRightLeft, Skull, Home, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { Elder, Branch, ElderMovement, ElderOutcome } from '@/types'
import { format } from 'date-fns'
import DeathRecordDialog from './DeathRecordDialog'

export default function ElderProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isFounder, isTrustee, isStaff } = useAuth()
  const [elder, setElder] = useState<Elder | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeathDialog, setShowDeathDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferBranch, setTransferBranch] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [transferReason, setTransferReason] = useState('')

  useEffect(() => {
    if (id) {
      loadElder()
      loadBranches()
    }
  }, [id])

  async function loadElder() {
    try {
      const data = await eldersApi.getById(id!)
      setElder(data)
    } catch (error) {
      toast.error('Failed to load elder')
      navigate('/elders')
    } finally {
      setLoading(false)
    }
  }

  async function loadBranches() {
    try {
      const data = await branchesApi.getAll()
      setBranches(data)
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    if (!elder || !transferBranch || !transferDate) return

    try {
      await eldersApi.submitTransfer({
        elderId: elder.id,
        destinationBranchId: transferBranch,
        transferDate,
        reason: transferReason || undefined,
      })
      toast.success('Transfer request submitted')
      setShowTransferDialog(false)
      setTransferBranch('')
      setTransferDate('')
      setTransferReason('')
      loadElder()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit transfer')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!elder) return null

  const currentBranch = typeof elder.currentBranch === 'object' ? elder.currentBranch as Branch : null
  const admissionBranch = typeof elder.admissionBranch === 'object' ? elder.admissionBranch as Branch : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/elders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{elder.name}</h1>
            <p className="text-gray-600">
              {elder.admissionNumber} | S.No: {elder.serialNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(isFounder || isTrustee) && (
            <Link to={`/elders/${elder.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          {isStaff && elder.currentStatus === 'active' && (
            <Link to={`/elders/${elder.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Request Edit
              </Button>
            </Link>
          )}
          {elder.currentStatus === 'active' && (
            <>
              <Button variant="outline" onClick={() => setShowTransferDialog(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
              <Button variant="outline" onClick={() => setShowDeathDialog(true)}>
                <Skull className="h-4 w-4 mr-2" />
                Record Death
              </Button>
              <Button variant="outline" onClick={() => {
                // Handle return home
                toast.info('Return home feature')
              }}>
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{elder.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{elder.age}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium capitalize">{elder.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Admission Number</p>
                <p className="font-medium">{elder.admissionNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="font-medium">{elder.serialNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={elder.currentStatus === 'active' ? 'default' : 'secondary'}>
                  {elder.currentStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
              {elder.policeMemoNumber && (
                <div>
                  <p className="text-sm text-gray-500">Police Memo No.</p>
                  <p className="font-medium">{elder.policeMemoNumber}</p>
                </div>
              )}
              {elder.referredBy && (
                <div>
                  <p className="text-sm text-gray-500">Referred By</p>
                  <p className="font-medium">{elder.referredBy}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Current Branch</p>
                <p className="font-medium">{currentBranch?.name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Admission Branch</p>
                <p className="font-medium">{admissionBranch?.name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Admission Date</p>
                <p className="font-medium">
                  {elder.admissionDate ? format(new Date(elder.admissionDate), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{elder.phone || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {elder.photoUrl ? (
              <img src={elder.photoUrl} alt={elder.name} className="w-48 h-48 object-cover rounded-lg" />
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                No photo
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Movement History */}
      {elder.movements && elder.movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {elder.movements.map((movement: ElderMovement, index: number) => {
                const fromBranch = typeof movement.fromBranch === 'object' ? movement.fromBranch as Branch : null
                const toBranch = typeof movement.toBranch === 'object' ? movement.toBranch as Branch : null
                return (
                  <div key={movement.id || index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${movement.movementType === 'admission' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {movement.movementType === 'admission' ? (
                        <Home className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {movement.movementType === 'admission' ? 'Admitted to' : 'Transferred to'} {toBranch?.name || '—'}
                      </p>
                      {fromBranch && (
                        <p className="text-xs text-gray-500">From: {fromBranch.name}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {movement.movementDate ? format(new Date(movement.movementDate), 'MMM d, yyyy') : '—'}
                        {movement.reason && ` • ${movement.reason}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outcomes */}
      {elder.outcomes && elder.outcomes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {elder.outcomes.map((outcome: ElderOutcome, index: number) => {
                const branch = typeof outcome.branchId === 'object' ? outcome.branchId as Branch : null
                return (
                  <div key={outcome.id || index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm capitalize">{outcome.outcomeType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">
                      Branch: {branch?.name || '—'} | Date: {outcome.outcomeDate ? format(new Date(outcome.outcomeDate), 'MMM d, yyyy') : '—'}
                    </p>
                    {outcome.reason && (
                      <p className="text-xs text-gray-500">Reason: {outcome.reason}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Transfer Elder</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Destination Branch *</label>
                  <select
                    className="w-full h-10 px-3 border rounded-md text-sm mt-1"
                    value={transferBranch}
                    onChange={(e) => setTransferBranch(e.target.value)}
                    required
                  >
                    <option value="">Select branch</option>
                    {branches
                      .filter((b) => b.id !== currentBranch?.id && b.isActive)
                      .map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Transfer Date *</label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 border rounded-md text-sm mt-1"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <input
                    className="w-full h-10 px-3 border rounded-md text-sm mt-1"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Optional reason"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Submit Transfer</Button>
                  <Button type="button" variant="outline" onClick={() => setShowTransferDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Card>
      )}

      {/* Death Dialog */}
      <DeathRecordDialog
        open={showDeathDialog}
        onClose={() => setShowDeathDialog(false)}
        elderId={elder.id}
        elderName={elder.name}
        onSuccess={loadElder}
      />
    </div>
  )
}

