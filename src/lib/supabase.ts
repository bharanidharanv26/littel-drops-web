/*
  Prototype-only in-memory Supabase adapter.
  It mimics the subset of Supabase APIs used by this app so the UI can run
  without a real database or Supabase project.
  Updated to match the Little Drops Master Project Document v2.0.
*/

type Row = Record<string, unknown>

type QueryResult<T = any> = {
  data: T
  error: { message: string } | null
  count?: number | null
}

interface ProfileRow {
  id: string
  name: string
  email: string
  role: 'founder' | 'trustee' | 'staff'
  is_active: boolean
  is_higher_authority: boolean
  created_at: string
}

interface BranchRow {
  id: string
  name: string
  location: string
  is_active: boolean
  created_at: string
}

interface ElderRow {
  id: string
  admission_number: string
  serial_number: number | null
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
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
  status: 'active' | 'transferred' | 'deceased' | 'returned_home' | 'other'
  outcome_reason: string | null
  created_at: string
  created_by: string | null
}

interface TransferRow {
  id: string
  elder_id: string
  from_branch_id: string
  to_branch_id: string
  transfer_date: string
  reason: string | null
  transferred_by: string | null
  created_at: string
}

interface DeathRow {
  id: string
  elder_id: string
  branch_id: string
  death_date: string
  remarks: string | null
  recorded_by: string | null
  created_at: string
}

interface AdmissionRow {
  id: string
  elder_id: string
  admission_branch_id: string
  admission_date: string
  admission_number: string
  created_at: string
}

interface RequestRow {
  id: string
  request_type: string
  elder_id: string | null
  from_branch_id: string | null
  to_branch_id: string | null
  submitted_by: string
  reviewed_by: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  payload: Record<string, unknown> | null
  decision_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  created_at: string
}

interface NotificationRow {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

interface AuditLogRow {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

interface UserInviteRow {
  id: string
  name: string
  email: string
  role: 'founder' | 'trustee' | 'staff'
  status: 'pending' | 'processed' | 'cancelled'
  created_at: string
}

type TableMap = {
  branches: BranchRow[]
  profiles: ProfileRow[]
  elders: ElderRow[]
  admissions: AdmissionRow[]
  transfers: TransferRow[]
  deaths: DeathRow[]
  requests: RequestRow[]
  notifications: NotificationRow[]
  audit_logs: AuditLogRow[]
  user_invites: UserInviteRow[]
}

type Filter = { field: string; value: unknown }
type RangeFilter = { field: string; gte?: unknown; lte?: unknown; gt?: unknown; lt?: unknown; in?: unknown[] }

const prototypeMode = true
export const isSupabaseConfigured = prototypeMode

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const founderId = 'user_founder_1'
const trusteeId = 'user_trustee_1'
const staffId = 'user_staff_1'

let serialCounter = 1

const tables: TableMap = {
  branches: [
    { id: 'b_paraniputhur', name: 'Paraniputhur', location: 'Kalluri Salai, Koluthuvanchery, Paraniputhur, Chennai', is_active: true, created_at: nowIso() },
    { id: 'b_gerugambakkam', name: 'Gerugambakkam', location: 'Gerugambakkam, Chennai', is_active: true, created_at: nowIso() },
    { id: 'b_somangalam', name: 'Somangalam', location: 'Somangalam', is_active: true, created_at: nowIso() },
    { id: 'b_sriperumbudur', name: 'Sriperumbudur', location: 'Sriperumbudur', is_active: true, created_at: nowIso() },
    { id: 'b_bengaluru', name: 'Bengaluru', location: 'Bengaluru', is_active: true, created_at: nowIso() },
    { id: 'b_morappur', name: 'Morappur', location: 'Morappur', is_active: true, created_at: nowIso() },
    { id: 'b_arcot', name: 'Arcot', location: 'Arcot', is_active: true, created_at: nowIso() },
    { id: 'b_batlagundu', name: 'Batlagundu', location: 'Batlagundu', is_active: true, created_at: nowIso() },
  ],
  profiles: [
    {
      id: founderId,
      name: 'Founder',
      email: 'founder@littledrops.org',
      role: 'founder',
      is_active: true,
      is_higher_authority: true,
      created_at: nowIso(),
    },
    {
      id: trusteeId,
      name: 'Trustee User',
      email: 'trustee@littledrops.org',
      role: 'trustee',
      is_active: true,
      is_higher_authority: false,
      created_at: nowIso(),
    },
    {
      id: staffId,
      name: 'Staff User',
      email: 'staff@littledrops.org',
      role: 'staff',
      is_active: true,
      is_higher_authority: false,
      created_at: nowIso(),
    },
  ],
  elders: [
    {
      id: 'e_001',
      admission_number: 'LD-PAR-2026-0001',
      serial_number: serialCounter++,
      name: 'Raman Iyer',
      age: 78,
      gender: 'male',
      date_of_birth: '1948-06-14',
      police_memo_number: null,
      referred_by: 'Self',
      address: '12, Lake View Road, Chennai',
      phone: '+91 9876543210',
      emergency_contact_name: 'Meena Iyer',
      emergency_contact_phone: '+91 9000000001',
      medical_notes: 'Hypertension - regular medication',
      photo_url: null,
      admission_branch_id: 'b_paraniputhur',
      current_branch_id: 'b_paraniputhur',
      admission_date: '2026-01-10',
      status: 'active',
      outcome_reason: null,
      created_at: nowIso(),
      created_by: founderId,
    },
    {
      id: 'e_002',
      admission_number: 'LD-GER-2026-0001',
      serial_number: serialCounter++,
      name: 'Lakshmi Devi',
      age: 82,
      gender: 'female',
      date_of_birth: '1944-03-22',
      police_memo_number: null,
      referred_by: 'NGO Partner',
      address: 'West Masi Street, Gerugambakkam',
      phone: '+91 9876500002',
      emergency_contact_name: 'Ravi Kumar',
      emergency_contact_phone: '+91 9000000002',
      medical_notes: null,
      photo_url: null,
      admission_branch_id: 'b_gerugambakkam',
      current_branch_id: 'b_gerugambakkam',
      admission_date: '2026-02-02',
      status: 'active',
      outcome_reason: null,
      created_at: nowIso(),
      created_by: founderId,
    },
  ],
  admissions: [],
  transfers: [],
  deaths: [],
  requests: [],
  notifications: [],
  audit_logs: [],
  user_invites: [],
}

for (const elder of tables.elders) {
  tables.admissions.push({
    id: uid('adm'),
    elder_id: elder.id,
    admission_branch_id: elder.admission_branch_id,
    admission_date: elder.admission_date,
    admission_number: elder.admission_number,
    created_at: nowIso(),
  })
}

let currentSession: { user: { id: string; email?: string }; access_token: string } | null = null

const authListeners = new Set<(event: string, session: typeof currentSession) => void>()

function notifyAuth(event: string) {
  for (const cb of authListeners) cb(event, currentSession)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createNotification(userId: string, title: string, message: string, entityType?: string, entityId?: string) {
  tables.notifications.push({
    id: uid('notif'),
    user_id: userId,
    title,
    message,
    is_read: false,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    created_at: nowIso(),
  })
}

function notifyAllTrustees(title: string, message: string, entityType?: string, entityId?: string) {
  const trustees = tables.profiles.filter(p => p.role === 'trustee' && p.is_active)
  for (const t of trustees) {
    createNotification(t.id, title, message, entityType, entityId)
  }
}

function enrichRows(table: keyof TableMap, rows: Row[]) {
  if (table === 'elders') {
    return rows.map((r) => {
      const row = r as unknown as ElderRow
      const currentBranch = tables.branches.find((b) => b.id === row.current_branch_id)
      const admissionBranch = tables.branches.find((b) => b.id === row.admission_branch_id)
      return {
        ...row,
        current_branch: currentBranch
          ? { id: currentBranch.id, name: currentBranch.name, location: currentBranch.location }
          : undefined,
        admission_branch: admissionBranch
          ? { id: admissionBranch.id, name: admissionBranch.name, location: admissionBranch.location }
          : undefined,
      }
    })
  }

  if (table === 'transfers') {
    return rows.map((r) => {
      const row = r as unknown as TransferRow
      const elder = tables.elders.find((e) => e.id === row.elder_id)
      const fromBranch = tables.branches.find((b) => b.id === row.from_branch_id)
      const toBranch = tables.branches.find((b) => b.id === row.to_branch_id)
      const byProfile = tables.profiles.find((p) => p.id === row.transferred_by)
      return {
        ...row,
        elder: elder ? [{ name: elder.name, admission_number: elder.admission_number }] : null,
        from_branch: fromBranch ? [{ name: fromBranch.name, id: fromBranch.id }] : null,
        to_branch: toBranch ? [{ name: toBranch.name, id: toBranch.id }] : null,
        transferred_by_profile: byProfile ? { name: byProfile.name } : undefined,
      }
    })
  }

  if (table === 'deaths') {
    return rows.map((r) => {
      const row = r as unknown as DeathRow
      const branch = tables.branches.find((b) => b.id === row.branch_id)
      const byProfile = tables.profiles.find((p) => p.id === row.recorded_by)
      return {
        ...row,
        branch: branch ? { name: branch.name, id: branch.id } : undefined,
        recorded_by_profile: byProfile ? { name: byProfile.name } : undefined,
      }
    })
  }

  if (table === 'audit_logs') {
    return rows.map((r) => {
      const row = r as unknown as AuditLogRow
      const user = tables.profiles.find((p) => p.id === row.user_id)
      return {
        ...row,
        user: user ? { name: user.name } : null,
      }
    })
  }

  if (table === 'requests') {
    return rows.map((r) => {
      const row = r as unknown as RequestRow
      const elder = row.elder_id ? tables.elders.find((e) => e.id === row.elder_id) : null
      const fromBranch = row.from_branch_id ? tables.branches.find((b) => b.id === row.from_branch_id) : null
      const toBranch = row.to_branch_id ? tables.branches.find((b) => b.id === row.to_branch_id) : null
      const submittedBy = tables.profiles.find((p) => p.id === row.submitted_by)
      const reviewedBy = row.reviewed_by ? tables.profiles.find((p) => p.id === row.reviewed_by) : null
      return {
        ...row,
        elder: elder ? { name: elder.name, admission_number: elder.admission_number, id: elder.id } : null,
        from_branch: fromBranch ? { name: fromBranch.name, id: fromBranch.id } : null,
        to_branch: toBranch ? { name: toBranch.name, id: toBranch.id } : null,
        submitted_by_profile: submittedBy ? { name: submittedBy.name } : null,
        reviewed_by_profile: reviewedBy ? { name: reviewedBy.name } : null,
      }
    })
  }

  return rows
}

class QueryBuilder implements PromiseLike<QueryResult<unknown>> {
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private filters: Filter[] = []
  private rangeFilters: RangeFilter[] = []
  private orderField: string | null = null
  private ascending = true
  private limitValue: number | null = null
  private expectSingle = false
  private maybeSingleMode = false
  private countExact = false
  private insertPayload: Row[] = []
  private updatePayload: Row = {}
  private selectColumns: string | null = null

  private readonly table: keyof TableMap

  constructor(table: keyof TableMap) {
    this.table = table
  }

  select(_columns?: string, options?: { count?: 'exact' }) {
    this.mode = 'select'
    this.selectColumns = _columns ?? null
    this.countExact = options?.count === 'exact'
    return this
  }

  insert(values: Row | Row[]) {
    this.mode = 'insert'
    this.insertPayload = Array.isArray(values) ? values : [values]
    return this
  }

  update(values: Row) {
    this.mode = 'update'
    this.updatePayload = values
    return this
  }

  delete() {
    this.mode = 'delete'
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, value })
    return this
  }

  neq(field: string, value: unknown) {
    // Simulate neq by marking negative filters
    this.filters.push({ field: `__neq:${field}`, value })
    return this
  }

  gt(field: string, value: unknown) {
    this.rangeFilters.push({ field, gt: value })
    return this
  }

  gte(field: string, value: unknown) {
    this.rangeFilters.push({ field, gte: value })
    return this
  }

  lt(field: string, value: unknown) {
    this.rangeFilters.push({ field, lt: value })
    return this
  }

  lte(field: string, value: unknown) {
    this.rangeFilters.push({ field, lte: value })
    return this
  }

  in(field: string, values: unknown[]) {
    this.rangeFilters.push({ field, in: values })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field
    this.ascending = options?.ascending ?? true
    return this
  }

  limit(value: number) {
    this.limitValue = value
    return this
  }

  single() {
    this.expectSingle = true
    return this
  }

  maybeSingle() {
    this.maybeSingleMode = true
    return this
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined)
  }

  private async execute(): Promise<QueryResult<any>> {
    if (this.mode === 'insert') return this.executeInsert()
    if (this.mode === 'update') return this.executeUpdate()
    if (this.mode === 'delete') return this.executeDelete()
    return this.executeSelect()
  }

  private readTable(): Row[] {
    return tables[this.table] as unknown as Row[]
  }

  private applyFilters(rows: Row[]) {
    let result = rows
    // Standard eq filters
    const eqFilters = this.filters.filter(f => !f.field.startsWith('__neq:'))
    if (eqFilters.length) {
      result = result.filter((row) => eqFilters.every((f) => (row as Row)[f.field] === f.value))
    }
    // neq filters
    const neqFilters = this.filters.filter(f => f.field.startsWith('__neq:'))
    if (neqFilters.length) {
      result = result.filter((row) => neqFilters.every((f) => {
        const realField = f.field.replace('__neq:', '')
        return (row as Row)[realField] !== f.value
      }))
    }
    // Range filters
    for (const rf of this.rangeFilters) {
      result = result.filter((row) => {
        const val = (row as Row)[rf.field]
        if (rf.in !== undefined) return rf.in.includes(val)
        if (rf.gte !== undefined && val < rf.gte) return false
        if (rf.lte !== undefined && val > rf.lte) return false
        if (rf.gt !== undefined && val <= rf.gt) return false
        if (rf.lt !== undefined && val >= rf.lt) return false
        return true
      })
    }
    return result
  }

  private applyOrderAndLimit(rows: Row[]) {
    const next = [...rows]
    if (this.orderField) {
      next.sort((a, b) => {
        const av = (a as Row)[this.orderField!]
        const bv = (b as Row)[this.orderField!]
        if (av === bv) return 0
        const gt = av! > bv! ? 1 : -1
        return this.ascending ? gt : -gt
      })
    }
    if (this.limitValue !== null) return next.slice(0, this.limitValue)
    return next
  }

  private async executeSelect(): Promise<QueryResult<any>> {
    const source = this.readTable()
    const filtered = this.applyFilters(source)
    const count = this.countExact ? filtered.length : null
    const prepared = this.applyOrderAndLimit(filtered)
    const enriched = enrichRows(this.table, prepared)

    if (this.expectSingle) {
      const first = enriched[0]
      if (!first) return { data: null, error: { message: 'No rows found' }, count }
      return { data: clone(first), error: null, count }
    }

    if (this.maybeSingleMode) {
      const first = enriched[0] ?? null
      return { data: clone(first), error: null, count }
    }

    return { data: clone(enriched), error: null, count }
  }

  private withDefaults(table: keyof TableMap, row: Row): Row {
    if (table === 'branches') {
      return { id: uid('branch'), created_at: nowIso(), is_active: true, location: '', ...row }
    }
    if (table === 'elders') {
      return {
        id: uid('elder'),
        created_at: nowIso(),
        status: 'active',
        serial_number: null,
        police_memo_number: null,
        referred_by: null,
        outcome_reason: null,
        ...row,
      }
    }
    if (table === 'audit_logs') {
      return {
        id: uid('audit'),
        created_at: nowIso(),
        entity_id: null,
        details: null,
        user_id: currentSession?.user.id ?? null,
        ...row,
      }
    }
    if (table === 'requests') {
      return {
        id: uid('req'),
        created_at: nowIso(),
        submitted_at: nowIso(),
        status: 'pending',
        reviewed_by: null,
        decision_reason: null,
        reviewed_at: null,
        payload: null,
        ...row,
      }
    }
    if (table === 'notifications') {
      return {
        id: uid('notif'),
        created_at: nowIso(),
        is_read: false,
        entity_type: null,
        entity_id: null,
        ...row,
      }
    }
    if (table === 'user_invites') {
      return { id: uid('invite'), created_at: nowIso(), status: 'pending', ...row }
    }
    return { id: uid(String(table).slice(0, 3)), created_at: nowIso(), ...row }
  }

  private async executeInsert(): Promise<QueryResult<any>> {
    const source = this.readTable()
    const rows = this.insertPayload.map((r) => this.withDefaults(this.table, r))
    source.push(...rows)

    if (this.table === 'elders') {
      for (const row of rows as unknown as ElderRow[]) {
        if (!row.serial_number) {
          row.serial_number = serialCounter++
        }
        tables.admissions.push({
          id: uid('adm'),
          elder_id: row.id,
          admission_branch_id: row.admission_branch_id,
          admission_date: row.admission_date,
          admission_number: row.admission_number,
          created_at: nowIso(),
        })
      }
    }

    const enriched = enrichRows(this.table, rows)
    if (this.expectSingle) {
      return { data: clone(enriched[0] ?? null), error: null }
    }
    return { data: clone(enriched), error: null }
  }

  private async executeUpdate(): Promise<QueryResult<any>> {
    const source = this.readTable()
    const filtered = this.applyFilters(source)
    for (const row of filtered) {
      Object.assign(row, this.updatePayload)
    }
    const enriched = enrichRows(this.table, filtered)
    if (this.expectSingle) {
      return { data: clone(enriched[0] ?? null), error: null }
    }
    return { data: clone(enriched), error: null }
  }

  private async executeDelete(): Promise<QueryResult<any>> {
    const source = this.readTable()
    const filtered = this.applyFilters(source)
    const toDelete = new Set(filtered)
    const remaining = source.filter(row => !toDelete.has(row))
    ;(tables as any)[this.table] = remaining
    return { data: clone(filtered), error: null }
  }
}

async function handleRpc(name: string, params: Record<string, unknown>) {
  if (name === 'transfer_elder') {
    const elderId = String(params.p_elder_id ?? '')
    const toBranchId = String(params.p_to_branch_id ?? '')
    const transferDate = String(params.p_transfer_date ?? today())
    const reason = (params.p_reason as string | null | undefined) ?? null

    const elder = tables.elders.find((e) => e.id === elderId && e.status === 'active')
    if (!elder) return { data: null, error: { message: 'Active elder not found' } }
    if (elder.current_branch_id === toBranchId) {
      return { data: null, error: { message: 'Destination branch must be different' } }
    }

    const fromBranchId = elder.current_branch_id
    elder.current_branch_id = toBranchId

    tables.transfers.push({
      id: uid('tr'),
      elder_id: elder.id,
      from_branch_id: fromBranchId,
      to_branch_id: toBranchId,
      transfer_date: transferDate,
      reason,
      transferred_by: currentSession?.user.id ?? null,
      created_at: nowIso(),
    })

    tables.audit_logs.push({
      id: uid('audit'),
      user_id: currentSession?.user.id ?? null,
      action: 'TRANSFER_ELDER',
      entity_type: 'elder',
      entity_id: elder.id,
      details: {
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        transfer_date: transferDate,
        reason,
      },
      created_at: nowIso(),
    })

    // Notify trustees
    const fromBranch = tables.branches.find(b => b.id === fromBranchId)
    const toBranch = tables.branches.find(b => b.id === toBranchId)
    notifyAllTrustees(
      'Elder Transferred',
      `${elder.name} transferred from ${fromBranch?.name} to ${toBranch?.name}`,
      'elder',
      elder.id
    )

    return { data: null, error: null }
  }

  if (name === 'record_elder_death') {
    const elderId = String(params.p_elder_id ?? '')
    const deathDate = String(params.p_death_date ?? today())
    const remarks = (params.p_remarks as string | null | undefined) ?? null

    const elder = tables.elders.find((e) => e.id === elderId && e.status === 'active')
    if (!elder) return { data: null, error: { message: 'Active elder not found' } }

    elder.status = 'deceased'

    tables.deaths.push({
      id: uid('death'),
      elder_id: elder.id,
      branch_id: elder.current_branch_id,
      death_date: deathDate,
      remarks,
      recorded_by: currentSession?.user.id ?? null,
      created_at: nowIso(),
    })

    tables.audit_logs.push({
      id: uid('audit'),
      user_id: currentSession?.user.id ?? null,
      action: 'RECORD_DEATH',
      entity_type: 'elder',
      entity_id: elder.id,
      details: { branch_id: elder.current_branch_id, death_date: deathDate, remarks },
      created_at: nowIso(),
    })

    notifyAllTrustees(
      'Death Recorded',
      `${elder.name} has been recorded as deceased`,
      'elder',
      elder.id
    )

    return { data: null, error: null }
  }

  if (name === 'record_return_home') {
    const elderId = String(params.p_elder_id ?? '')
    const returnDate = String(params.p_return_date ?? today())
    const remarks = (params.p_remarks as string | null | undefined) ?? null

    const elder = tables.elders.find((e) => e.id === elderId && e.status === 'active')
    if (!elder) return { data: null, error: { message: 'Active elder not found' } }

    elder.status = 'returned_home'
    elder.outcome_reason = remarks

    tables.audit_logs.push({
      id: uid('audit'),
      user_id: currentSession?.user.id ?? null,
      action: 'RETURN_HOME',
      entity_type: 'elder',
      entity_id: elder.id,
      details: { branch_id: elder.current_branch_id, return_date: returnDate, remarks },
      created_at: nowIso(),
    })

    const branch = tables.branches.find(b => b.id === elder.current_branch_id)
    notifyAllTrustees(
      'Return Home Recorded',
      `${elder.name} from ${branch?.name} has been returned home`,
      'elder',
      elder.id
    )

    return { data: null, error: null }
  }

  if (name === 'record_other_outcome') {
    const elderId = String(params.p_elder_id ?? '')
    const reason = String(params.p_reason ?? '')
    const outcomeDate = String(params.p_outcome_date ?? today())

    const elder = tables.elders.find((e) => e.id === elderId && e.status === 'active')
    if (!elder) return { data: null, error: { message: 'Active elder not found' } }

    elder.status = 'other'
    elder.outcome_reason = reason

    tables.audit_logs.push({
      id: uid('audit'),
      user_id: currentSession?.user.id ?? null,
      action: 'OTHER_OUTCOME',
      entity_type: 'elder',
      entity_id: elder.id,
      details: { branch_id: elder.current_branch_id, outcome_date: outcomeDate, reason },
      created_at: nowIso(),
    })

    return { data: null, error: null }
  }

  return { data: null, error: { message: `Unsupported RPC: ${name}` } }
}

// Valid login credentials: founder, trustee, staff with password 'little'
const validCredentials: Record<string, { password: string; userId: string }> = {
  'founder@littledrops.org': { password: 'little', userId: founderId },
  'trustee@littledrops.org': { password: 'little', userId: trusteeId },
  'staff@littledrops.org': { password: 'little', userId: staffId },
  // Legacy credentials for backward compatibility
  'a@gmail.com': { password: '1212', userId: founderId },
}

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: currentSession }, error: null }
    },
    onAuthStateChange(callback: (event: string, session: typeof currentSession) => void) {
      authListeners.add(callback)
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback)
            },
          },
        },
      }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const normalized = email.trim().toLowerCase()
      const cred = validCredentials[normalized]

      if (!cred || cred.password !== password) {
        return { data: { session: null }, error: { message: 'Invalid login credentials' } }
      }

      const profile = tables.profiles.find((p) => p.id === cred.userId)
      if (profile && !profile.is_active) {
        return { data: { session: null }, error: { message: 'Account is disabled' } }
      }

      const userId = cred.userId
      currentSession = {
        user: { id: userId, email: normalized },
        access_token: `token_${uid('auth')}`,
      }
      notifyAuth('SIGNED_IN')

      // Audit login
      tables.audit_logs.push({
        id: uid('audit'),
        user_id: userId,
        action: 'LOGIN',
        entity_type: 'auth',
        entity_id: null,
        details: { email: normalized },
        created_at: nowIso(),
      })

      return { data: { session: currentSession, user: currentSession.user }, error: null }
    },
    async signOut() {
      if (currentSession) {
        tables.audit_logs.push({
          id: uid('audit'),
          user_id: currentSession.user.id,
          action: 'LOGOUT',
          entity_type: 'auth',
          entity_id: null,
          details: null,
          created_at: nowIso(),
        })
      }
      currentSession = null
      notifyAuth('SIGNED_OUT')
      return { error: null }
    },
  },

  from(table: keyof TableMap) {
    return new QueryBuilder(table)
  },

  async rpc(name: string, params: Record<string, unknown>) {
    return handleRpc(name, params)
  },

  storage: {
    from(_bucket: string) {
      return {
        async upload(path: string, _file: unknown, _options?: { upsert?: boolean }) {
          return { data: { path }, error: null }
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `https://prototype.local/${path}` } }
        },
      }
    },
  },
}
