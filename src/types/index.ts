// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'founder' | 'trustee' | 'staff'
export type ElderStatus = 'active' | 'transferred' | 'deceased' | 'returned_home' | 'other'
export type ElderGender = 'male' | 'female' | 'other'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type RequestType = 'admission' | 'transfer' | 'death' | 'return_home' | 'other' | 'edit'

// ─── Database Entities ────────────────────────────────────────────────────────

export interface Branch {
  id: string
  name: string
  location: string
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  is_higher_authority: boolean
  created_at: string
}

export interface Elder {
  id: string
  admission_number: string
  serial_number: number | null
  name: string
  age: number
  gender: ElderGender
  date_of_birth: string | null
  police_memo_number: string | null
  referred_by: string | null
  address: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  medical_notes: string | null
  photo_url: string | null
  admission_branch_id: string
  current_branch_id: string
  admission_date: string
  status: ElderStatus
  outcome_reason: string | null
  created_at: string
  created_by: string
  // Joined fields
  admission_branch?: Branch
  current_branch?: Branch
}

export interface Transfer {
  id: string
  elder_id: string
  from_branch_id: string
  to_branch_id: string
  transfer_date: string
  reason: string | null
  transferred_by: string
  created_at: string
  // Joined fields
  from_branch?: Branch
  to_branch?: Branch
  transferred_by_profile?: Profile
}

export interface Death {
  id: string
  elder_id: string
  branch_id: string
  death_date: string
  remarks: string | null
  recorded_by: string
  created_at: string
  // Joined fields
  branch?: Branch
  recorded_by_profile?: Profile
}

export interface Request {
  id: string
  request_type: RequestType
  elder_id: string | null
  from_branch_id: string | null
  to_branch_id: string | null
  submitted_by: string
  reviewed_by: string | null
  status: RequestStatus
  payload: Record<string, unknown> | null
  decision_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  created_at: string
  // Joined fields
  elder?: Elder
  from_branch?: Branch
  to_branch?: Branch
  submitted_by_profile?: Profile
  reviewed_by_profile?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  // Joined fields
  user?: Profile
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface GlobalStats {
  total_elders: number
  active_elders: number
  total_deaths: number
  total_transfers: number
  total_branches: number
  total_admissions: number
  male_count: number
  female_count: number
}

export interface BranchStats {
  branch_id: string
  branch_name: string
  current_elders: number
  total_admissions: number
  transfers_in: number
  transfers_out: number
  total_deaths: number
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface ElderFormData {
  name: string
  age: number
  gender: ElderGender
  date_of_birth?: string
  police_memo_number?: string
  referred_by?: string
  address: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  medical_notes?: string
  admission_branch_id: string
  admission_date: string
  photo_url?: string
}

export interface TransferFormData {
  elder_id: string
  from_branch_id: string
  to_branch_id: string
  transfer_date: string
  reason?: string
}

export interface DeathFormData {
  elder_id: string
  branch_id: string
  death_date: string
  remarks?: string
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role: UserRole
}
