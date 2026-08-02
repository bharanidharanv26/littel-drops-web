import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const [email, setEmail] = useState('a@gmail.com')
  const [password, setPassword] = useState('1212')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
            <Heart size={40} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Little Drops</h1>
          <h2 className="text-xl font-light text-blue-100 mb-6">Old Age Home</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Centralized management platform for all Little Drops branches. 
            Managing elder care with compassion and precision.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Branches', sub: 'All in one' },
              { label: 'Elders', sub: 'Managed' },
              { label: 'Transfers', sub: 'Tracked' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-xs text-blue-200 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-3">
              <Heart size={28} className="text-white" fill="white" />
            </div>
            <h1 className="text-xl font-bold">Little Drops</h1>
            <p className="text-sm text-muted-foreground">Old Age Home</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access the management system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Access is restricted to authorized staff only.
            <br />
            Contact the Founder to request an account.
          </p>
        </div>
      </div>
    </div>
  )
}
