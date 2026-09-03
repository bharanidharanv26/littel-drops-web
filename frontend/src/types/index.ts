// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'founder' | 'trustee' | 'staff'
export type ElderStatus = 'pending_admission' | 'active' | 'transferred' | 'deceased' | 'returned_home' | 'other_outcome'
export type ElderGender = 'male' | 'female' | 'other'
export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'
export type RequestType = 'admission' | 'edit' | 'transfer' | 'death' | 'return_home' | 'other'
export type AssignmentType = 'permanent' | 'trustee' | 'temporary'

// ─── Database Entities ────────────────────────────────────────────────────────

export interface Branch {
  id: string
  _id: string
  name: string
  address: string
  phone: string
  isActive: boolean
  createdAt: string
  elder_count?: number
}

export interface User {
  id: string
  _id: string
  name: string
  username: string
  role: UserRole
  phone: string | null
  email: string | null
  profilePhoto: string | null
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
  branchAssignments?: BranchAssignment[]
}

// Alias for backward compatibility
export type Profile = User

export interface BranchAssignment {
  id: string
  _id: string
  userId: string
  branchId: string
  branchName?: string
  assignmentType: AssignmentType
  startDate: string
  endDate: string | null
  isActive: boolean
  createdBy: string
  createdByName?: string
  reason?: string
}

export interface Elder {
  id: string
  _id: string
  serialNumber: number | null
  admissionNumber: string
  name: string
  age: number
  gender: ElderGender
  dateOfBirth: string | null
  admissionDate: string
  admissionTime: string | null
  admissionBranch: string | Branch
  currentBranch: string | Branch
  currentStatus: ElderStatus
  policeMemoNumber: string | null
  referredBy: string | null
  address: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalNotes: string | null
  photoUrl: string | null
  outcomeReason: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  // Joined fields
  admission_branch?: Branch
  current_branch?: Branch
  movements?: ElderMovement[]
  outcomes?: ElderOutcome[]
  requests?: Request[]
}

export interface ElderMovement {
  id: string
  _id: string
  elderId: string
  fromBranch: string | Branch | null
  toBranch: string | Branch
  movementType: 'admission' | 'transfer'
  movementDate: string
  movementTime: string | null
  reason: string | null
  initiatedBy: string | User
  approvedBy: string | User
  requestId: string | null
  createdAt: string
  // Joined fields
  from_branch?: Branch
  to_branch?: Branch
}

export interface ElderOutcome {
  id: string
  _id: string
  elderId: string
  outcomeType: 'death' | 'returned_home' | 'other'
  branchId: string | Branch
  outcomeDate: string
  outcomeTime: string | null
  reason: string | null
  details: string | null
  recordedBy: string | User
  approvedBy: string | User
  requestId: string | null
  createdAt: string
  // Joined fields
  branch?: Branch
}

export interface Request {
  id: string
  _id: string
  requestType: RequestType
  elderId: string | null
  requestedBy: string | User
  branchId: string | Branch | null
  sourceBranchId: string | Branch | null
  destinationBranchId: string | Branch | null
  proposedChanges: Record<string, unknown> | null
  reason: string | null
  status: RequestStatus
  reviewedBy: string | User | null
  reviewedAt: string | null
  reviewComment: string | null
  createdAt: string
  // Joined fields
  elder?: { name: string; admissionNumber: string }
  requested_by?: { name: string; username: string }
  reviewed_by?: { name: string; username: string }
  branch?: { name: string }
  source_branch?: { name: string }
  destination_branch?: { name: string }
}

export interface Notification {
  id: string
  _id: string
  recipientUserId: string
  type: string
  title: string
  message: string
  relatedEntityId: string | null
  relatedRequestId: string | null
  isRead: boolean
  createdAt: string
}

export interface AuditLog {
  id: string
  _id: string
  actorId: string | User
  actorRole: UserRole
  action: string
  entityType: string
  entityId: string | null
  branchId: string | null
  requestId: string | null
  beforeValue: Record<string, unknown> | null
  afterValue: Record<string, unknown> | null
  reason: string | null
  result: string | null
  details: Record<string, unknown> | null
  createdAt: string
  // Joined fields
  actor?: { name: string; username: string }
}

export interface ImportJob {
  id: string
  _id: string
  initiatedBy: string | User
  fileName: string
  status: string
  totalRows: number
  imported: number
  skipped: number
  errors: number
  errorDetails: Array<{ row: string; error: string }>
  completedAt: string | null
  createdAt: string
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_elders: number
  active_elders: number
  male_count: number
  female_count: number
  total_admissions: number
  total_transfers: number
  total_deaths: number
  deceased_elders: number
  returned_elders: number
  other_outcomes: number
  pending_requests: number
  total_branches: number
  branchStats: Array<{
    id: string
    name: string
    current: number
    admissions: number
    transfers_in: number
    transfers_out: number
    deaths: number
    returned_home: number
  }>
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface ElderFormData {
  name: string
  age: number
  gender: ElderGender
  dateOfBirth?: string
  policeMemoNumber?: string
  referredBy?: string
  address: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalNotes?: string
  admissionBranch: string
  admissionDate: string
  admissionTime?: string
  admissionNumber?: string
  photoUrl?: string
}

export interface CreateUserData {
  name: string
  username: string
  password: string
  role: UserRole
  phone?: string
  email?: string
  branchId?: string
  assignmentType?: AssignmentType
}
