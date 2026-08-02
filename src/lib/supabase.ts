/*
  Prototype-only in-memory Supabase adapter.
  It mimics the subset of Supabase APIs used by this app so the UI can run
  without a real database or Supabase project.
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
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  date_of_birth: string | null
  address: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  medical_notes: string | null
  photo_url: string | null
  admission_branch_id: string
  current_branch_id: string
  admission_date: string
  status: 'active' | 'transferred' | 'deceased'
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
  audit_logs: AuditLogRow[]
  user_invites: UserInviteRow[]
}

type Filter = { field: string; value: unknown }

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

const tables: TableMap = {
  branches: [
    { id: 'b_chennai', name: 'Chennai', location: 'Anna Nagar, Chennai', is_active: true, created_at: nowIso() },
    { id: 'b_madurai', name: 'Madurai', location: 'KK Nagar, Madurai', is_active: true, created_at: nowIso() },
    { id: 'b_trichy', name: 'Trichy', location: 'Srirangam, Trichy', is_active: true, created_at: nowIso() },
  ],
  profiles: [
    {
      id: founderId,
      name: 'Founder Admin',
      email: 'a@gmail.com',
      role: 'founder',
      is_active: true,
      is_higher_authority: true,
      created_at: nowIso(),
    },
    {
      id: 'user_staff_1',
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
      admission_number: 'LD-CHE-2026-0001',
      name: 'Raman Iyer',
      age: 78,
      gender: 'male',
      date_of_birth: '1948-06-14',
      address: '12, Lake View Road, Chennai',
      phone: '+91 9876543210',
      emergency_contact_name: 'Meena Iyer',
      emergency_contact_phone: '+91 9000000001',
      medical_notes: 'Hypertension - regular medication',
      photo_url: null,
      admission_branch_id: 'b_chennai',
      current_branch_id: 'b_chennai',
      admission_date: '2026-01-10',
      status: 'active',
      created_at: nowIso(),
      created_by: founderId,
    },
    {
      id: 'e_002',
      admission_number: 'LD-MAD-2026-0001',
      name: 'Lakshmi Devi',
      age: 82,
      gender: 'female',
      date_of_birth: '1944-03-22',
      address: 'West Masi Street, Madurai',
      phone: '+91 9876500002',
      emergency_contact_name: 'Ravi Kumar',
      emergency_contact_phone: '+91 9000000002',
      medical_notes: null,
      photo_url: null,
      admission_branch_id: 'b_madurai',
      current_branch_id: 'b_madurai',
      admission_date: '2026-02-02',
      status: 'active',
      created_at: nowIso(),
      created_by: founderId,
    },
  ],
  admissions: [],
  transfers: [],
  deaths: [],
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

  return rows
}

class QueryBuilder implements PromiseLike<QueryResult<unknown>> {
  private mode: 'select' | 'insert' | 'update' = 'select'
  private filters: Filter[] = []
  private orderField: string | null = null
  private ascending = true
  private limitValue: number | null = null
  private expectSingle = false
  private maybeSingleMode = false
  private countExact = false
  private insertPayload: Row[] = []
  private updatePayload: Row = {}

  private readonly table: keyof TableMap

  constructor(table: keyof TableMap) {
    this.table = table
  }

  select(_columns?: string, options?: { count?: 'exact' }) {
    this.mode = 'select'
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

  eq(field: string, value: unknown) {
    this.filters.push({ field, value })
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
    return this.executeSelect()
  }

  private readTable(): Row[] {
    return tables[this.table] as unknown as Row[]
  }

  private applyFilters(rows: Row[]) {
    if (!this.filters.length) return rows
    return rows.filter((row) => this.filters.every((f) => (row as Row)[f.field] === f.value))
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
      return { id: uid('elder'), created_at: nowIso(), status: 'active', ...row }
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

    return { data: null, error: null }
  }

  return { data: null, error: { message: `Unsupported RPC: ${name}` } }
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
      if (normalized !== 'a@gmail.com' || password !== '1212') {
        return { data: { session: null }, error: { message: 'Invalid login credentials' } }
      }

      const profile = tables.profiles.find((p) => p.email.toLowerCase() === normalized)
      const userId = profile?.id ?? founderId
      currentSession = {
        user: { id: userId, email: normalized },
        access_token: `token_${uid('auth')}`,
      }
      notifyAuth('SIGNED_IN')

      return { data: { session: currentSession, user: currentSession.user }, error: null }
    },
    async signOut() {
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
