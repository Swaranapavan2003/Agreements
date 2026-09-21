import { Link } from 'react-router-dom'
import { Home, FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FileQuestion className="h-20 w-20 text-gray-300 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Page not found</h2>
        <p className="text-gray-500 mb-8">Sorry, the page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700">
          <Home className="h-4 w-4" /> Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
