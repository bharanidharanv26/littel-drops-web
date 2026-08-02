// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'founder' | 'branch_admin' | 'staff'
export type ElderStatus = 'active' | 'transferred' | 'deceased' | 'discharged'
export type ElderGender = 'male' | 'female' | 'other'

// ─── Database Entities ────────────────────────────────────────────────────────

export interface Branch {
  id: string
  name: string
  code: string
  location: string
  address: string
  phone: string
  manager_name: string
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  branch_id: string | null
  is_active: boolean
  is_higher_authority: boolean
  created_at: string
  // Joined fields
  branch?: Branch
}

export interface Elder {
  id: string
  admission_number: string
  name: string
  age: number
  gender: ElderGender
  date_of_birth: string | null
  blood_group: string | null
  religion: string | null
  marital_status: string | null
  father_name: string | null
  spouse_name: string | null
  occupation: string | null
  education: string | null
  photo_url: string | null
  aadhar_number: string | null
  address: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  guardian_name: string | null
  guardian_relationship: string | null
  guardian_phone: string | null
  guardian_address: string | null
  medical_notes: string | null
  medications: string | null
  allergies: string | null
  admission_branch_id: string
  current_branch_id: string
  admission_date: string
  admission_reason: string | null
  status: ElderStatus
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

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  // Joined fields
  user?: Profile
}

export interface Notification {
  id: string
  user_id: string | null
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
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
  blood_group?: string
  religion?: string
  marital_status?: string
  father_name?: string
  spouse_name?: string
  occupation?: string
  education?: string
  aadhar_number?: string
  address: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  guardian_name?: string
  guardian_relationship?: string
  guardian_phone?: string
  guardian_address?: string
  medical_notes?: string
  medications?: string
  allergies?: string
  admission_branch_id: string
  admission_date: string
  admission_reason?: string
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
  branch_id?: string
}
