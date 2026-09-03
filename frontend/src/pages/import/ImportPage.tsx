import { useState, useRef } from 'react'
import { importApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Upload, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PreviewRow {
  rowNumber: number
  data: any
  status: 'valid' | 'error' | 'duplicate'
  errors: string[]
  warnings: string[]
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ results: PreviewRow[]; summary: any } | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      parseExcel(f)
    }
  }

  async function parseExcel(file: File) {
    try {
      // Dynamic import for xlsx
      const XLSX = await import('xlsx')
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      // Map columns to our format
      const rows = jsonData.map((row: any) => ({
        serialNumber: row['S.No'] || row['S.No.'] || null,
        name: row['Name'] || row['name'] || '',
        age: row['Age'] || row['age'] || '',
        gender: (row['Gender'] || row['gender'] || 'male').toLowerCase(),
        admissionNumber: row['Admin No'] || row['Admission Number'] || row['adm_no'] || '',
        admissionDate: row['Date of Admission'] || row['Admission Date'] || row['adm_date'] || '',
        admissionBranch: row['Admission Location'] || row['Branch'] || '',
        policeMemoNumber: row['Police Station / Police Memo No'] || row['Police Memo'] || '',
        referredBy: row['Referred By'] || row['referred_by'] || '',
      }))

      // Preview
      const result = await importApi.preview(rows, file.name)
      setPreview(result)
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message)
    }
  }

  async function handleConfirmImport() {
    if (!preview) return

    const validRows = preview.results
      .filter((r) => r.status === 'valid')
      .map((r) => r.data)

    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setImporting(true)
    try {
      const result = await importApi.confirm(validRows, file?.name)
      setImportResult(result)
      toast.success(`Imported ${result.imported} records`)
    } catch (error: any) {
      toast.error(error.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Excel Import</h1>
        <p className="text-gray-600 mt-1">Import historical elder data from Excel files</p>
      </div>

      {/* Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Select Excel File
            </Button>
            {file && (
              <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{preview.summary.valid} valid</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{preview.summary.duplicates} duplicates</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">{preview.summary.errors} errors</span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Adm. No.</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.results.map((row) => (
                    <tr key={row.rowNumber} className="border-b">
                      <td className="p-2">{row.rowNumber}</td>
                      <td className="p-2">{row.data.name || '—'}</td>
                      <td className="p-2">{row.data.admissionNumber || '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          row.status === 'valid' ? 'bg-green-100 text-green-800' :
                          row.status === 'duplicate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {row.errors.join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleConfirmImport} disabled={importing || preview.summary.valid === 0}>
                {importing ? <LoadingSpinner size={16} className="mr-2" /> : null}
                Import {preview.summary.valid} Valid Records
              </Button>
              <Button variant="outline" onClick={() => { setPreview(null); setFile(null); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm"><strong>Imported:</strong> {importResult.imported}</p>
              <p className="text-sm"><strong>Skipped:</strong> {importResult.skipped}</p>
              <p className="text-sm"><strong>Errors:</strong> {importResult.errors}</p>
              {importResult.errorDetails?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Error Details:</h4>
                  {importResult.errorDetails.map((err: any, i: number) => (
                    <p key={i} className="text-xs text-red-600">{err.row}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
