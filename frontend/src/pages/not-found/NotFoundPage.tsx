import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link to="/dashboard">
          <Button className="mt-4">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
