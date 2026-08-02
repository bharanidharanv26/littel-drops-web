import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

function SetupRequired() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-xl rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Supabase Configuration Required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your Supabase credentials to a .env file in the project root, then restart
          the dev server.
        </p>
        <pre className="mt-4 rounded-md bg-muted p-3 text-xs overflow-x-auto">
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        </pre>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <SetupRequired />
    )}
  </StrictMode>,
)
