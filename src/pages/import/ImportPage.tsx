import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Branch } from '@/types'

interface ImportRow {
  name: string
  age: number
  gender: string
  admission_date: string
  admission_number: string
  branch_name: string
  police_memo: string
  referred_by: string
  phone: string
  address: string
  status: 'valid' | 'error' | 'duplicate'
  error?: string
}

export function ImportPage() {
  const { isFounder } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])

  // Load branches on mount
  useState(() => {
    supabase.from('branches').select('*').eq('is_active', true).order('name').then(({ data }) => {
      setBranches((data as Branch[]) ?? [])
    })
  })

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  function parseCSV(text: string) {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      toast.error('File must have a header row and at least one data row')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows: ImportRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })

      const importRow: ImportRow = {
        name: row['name'] ?? row['elder name'] ?? '',
        age: parseInt(row['age'] ?? '0') || 0,
        gender: (row['gender'] ?? 'male').toLowerCase(),
        admission_date: row['admission date'] ?? row['date of admission'] ?? '',
        admission_number: row['admission number'] ?? row['admin no'] ?? row['adm no'] ?? '',
        branch_name: row['branch'] ?? row['admission location'] ?? row['location'] ?? '',
        police_memo: row['police memo'] ?? row['police memo no'] ?? '',
        referred_by: row['referred by'] ?? '',
        phone: row['phone'] ?? '',
        address: row['address'] ?? '',
        status: 'valid',
      }

      // Validate
      const errors: string[] = []
      if (!importRow.name) errors.push('Name is required')
      if (!importRow.admission_number) errors.push('Admission number is required')
      if (importRow.age <= 0 || importRow.age > 130) errors.push('Invalid age')
      if (!['male', 'female', 'other'].includes(importRow.gender)) errors.push('Invalid gender')

      if (errors.length > 0) {
        importRow.status = 'error'
        importRow.error = errors.join('; ')
      }

      rows.push(importRow)
    }

    // Check for duplicates within the file
    const seen = new Set<string>()
    for (const row of rows) {
      if (row.status === 'error') continue
      if (seen.has(row.admission_number)) {
        row.status = 'duplicate'
        row.error = 'Duplicate admission number in file'
      }
      seen.add(row.admission_number)
    }

    setParsedRows(rows)
    setImportResult(null)
  }

  async function handleImport() {
    const validRows = parsedRows.filter(r => r.status === 'valid')
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setImporting(true)
    let imported = 0
    let skipped = 0
    let errors = 0

    for (const row of validRows) {
      // Check if admission number already exists
      const { data: existing } = await supabase
        .from('elders')
        .select('id')
        .eq('admission_number', row.admission_number)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      // Find or default branch
      const branch = branches.find(b =>
        b.name.toLowerCase() === row.branch_name.toLowerCase()
      )
      const branchId = branch?.id ?? branches[0]?.id

      if (!branchId) {
        errors++
        continue
      }

      const { error } = await supabase.from('elders').insert({
        name: row.name,
        age: row.age,
        gender: row.gender as 'male' | 'female' | 'other',
        address: row.address || 'Address not provided',
        phone: row.phone || 'Phone not provided',
        emergency_contact_name: 'Not provided',
        emergency_contact_phone: 'Not provided',
        admission_branch_id: branchId,
        current_branch_id: branchId,
        admission_date: row.admission_date || new Date().toISOString().slice(0, 10),
        admission_number: row.admission_number,
        police_memo_number: row.police_memo || null,
        referred_by: row.referred_by || null,
        status: 'active',
        created_by: 'user_founder_1',
      })

      if (error) {
        errors++
      } else {
        imported++
      }
    }

    // Audit the import
    await supabase.from('audit_logs').insert({
      user_id: 'user_founder_1',
      action: 'EXCEL_IMPORT',
      entity_type: 'import',
      entity_id: null,
      details: { imported, skipped, errors, total_rows: validRows.length },
    })

    setImportResult({ imported, skipped, errors })
    setImporting(false)

    if (imported > 0) {
      toast.success(`Successfully imported ${imported} elder records`)
    }
    if (skipped > 0) {
      toast.warning(`${skipped} records skipped (duplicates)`)
    }
    if (errors > 0) {
      toast.error(`${errors} records failed to import`)
    }
  }

  if (!isFounder) {
    return (
      <div className="p-6">
        <AlertCircle className="text-destructive" />
        <p>Only the Founder can import data.</p>
      </div>
    )
  }

  const validCount = parsedRows.filter(r => r.status === 'valid').length
  const errorCount = parsedRows.filter(r => r.status === 'error').length
  const dupCount = parsedRows.filter(r => r.status === 'duplicate').length

  return (
    <div className="animate-fade-in">
      <TopBar title="Excel Import" subtitle="Import historical elder records from spreadsheet" />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet size={18} />
              Upload Spreadsheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with columns: Name, Age, Gender, Admission Date, Admission Number, Branch, Police Memo, Referred By, Phone, Address.
            </p>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                Select File
              </Button>
              {parsedRows.length > 0 && (
                <div className="flex gap-2">
                  <Badge variant="success">{validCount} valid</Badge>
                  {dupCount > 0 && <Badge variant="warning">{dupCount} duplicates</Badge>}
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} errors</Badge>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {parsedRows.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye size={18} />
                Preview ({parsedRows.length} rows)
              </CardTitle>
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
              >
                {importing ? 'Importing...' : `Import ${validCount} Records`}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr className="border-b bg-muted/50">
                      {['Status', 'Name', 'Age', 'Gender', 'Adm No.', 'Branch', 'Date', 'Error'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => (
                      <tr key={i} className={`border-b ${row.status === 'error' ? 'bg-red-50' : row.status === 'duplicate' ? 'bg-yellow-50' : ''}`}>
                        <td className="px-3 py-2">
                          {row.status === 'valid' && <CheckCircle size={14} className="text-green-500" />}
                          {row.status === 'error' && <X size={14} className="text-red-500" />}
                          {row.status === 'duplicate' && <AlertCircle size={14} className="text-yellow-500" />}
                        </td>
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2">{row.age}</td>
                        <td className="px-3 py-2 capitalize">{row.gender}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.admission_number}</td>
                        <td className="px-3 py-2">{row.branch_name}</td>
                        <td className="px-3 py-2">{row.admission_date}</td>
                        <td className="px-3 py-2 text-xs text-red-600">{row.error ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {importResult && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <CheckCircle size={20} className="text-green-600" />
                <div>
                  <p className="text-sm font-medium">Import Complete</p>
                  <p className="text-xs text-muted-foreground">
                    {importResult.imported} imported, {importResult.skipped} skipped, {importResult.errors} errors
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>No silent overwrite — existing records with matching Admission Numbers are skipped.</p>
            <p>No accidental deletion — import only adds new records.</p>
            <p>Existing Serial Numbers are preserved. New admissions continue the sequence.</p>
            <p>Repeat imports are supported with conflict handling.</p>
            <p>After import, review the Audit Log to verify all records were imported correctly.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
