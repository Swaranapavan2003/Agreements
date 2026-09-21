import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, BookOpen, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

import { useTemplates, useDeleteTemplate } from '@/hooks/useTemplates'
import type { Template } from '@/types/template.types'

export function TemplatesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useTemplates({ page, per_page: 10, search })
  const deleteMutation = useDeleteTemplate()

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null)
      })
    }
  }

  if (isLoading) return <FullPageSpinner />

  const templates = data?.data.items || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your document templates and placeholders.</p>
        </div>
        <Button onClick={() => navigate('/templates/new')} leftIcon={<Plus className="h-4 w-4" />}>
          Create Template
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {templates.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="mx-auto h-12 w-12 text-gray-400" />}
            title="No templates found"
            description="Get started by creating a new document template."
            action={{ label: 'Create Template', onClick: () => navigate('/templates/new') }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Last Updated</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {templates.map((template: Template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      {template.description && (
                        <div className="text-gray-500 text-xs mt-1">{template.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={template.is_active ? 'success' : 'gray'}>
                        {template.is_active ? 'Active' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(template.updated_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/templates/${template.id}`)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data?.data.pages && data.data.pages > 1 && (
          <div className="mt-4 flex justify-end">
            <Pagination
              page={page}
              per_page={data.data.per_page}
              total={data.data.total}
              pages={data.data.pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
