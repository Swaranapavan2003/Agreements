import { useState, useEffect } from 'react'
import { Plus, Search, BookTemplate, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

import { useClauses, useCreateClause, useUpdateClause, useDeleteClause } from '@/hooks/useClauses'
import type { Clause } from '@/types/clause.types'

const clauseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  text_content: z.string().min(1, 'Text content is required'),
  is_standard: z.boolean(),
})

type ClauseFormData = z.infer<typeof clauseSchema>

export function ClausesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClause, setEditingClause] = useState<Clause | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useClauses({ page, per_page: 10, search })
  const createMutation = useCreateClause()
  const updateMutation = useUpdateClause()
  const deleteMutation = useDeleteClause()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClauseFormData>({
    resolver: zodResolver(clauseSchema),
    defaultValues: {
      name: '',
      category: '',
      text_content: '',
      is_standard: false,
    }
  })

  useEffect(() => {
    if (editingClause) {
      reset({
        name: editingClause.name,
        category: editingClause.category,
        text_content: editingClause.text_content,
        is_standard: editingClause.is_standard,
      })
    } else {
      reset({ name: '', category: '', text_content: '', is_standard: false })
    }
  }, [editingClause, reset])

  const handleOpenModal = (clause?: Clause) => {
    if (clause) setEditingClause(clause)
    else setEditingClause(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClause(null)
    reset()
  }

  const onSubmit = (formData: ClauseFormData) => {
    if (editingClause) {
      updateMutation.mutate({ id: editingClause.id, data: formData }, {
        onSuccess: () => handleCloseModal()
      })
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => handleCloseModal()
      })
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null)
      })
    }
  }

  if (isLoading) return <FullPageSpinner />

  const clauses = data?.data.items || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clause Library</h1>
          <p className="text-sm text-gray-500 mt-1">Manage reusable clauses for your agreements.</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="h-4 w-4" />}>
          Create Clause
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search clauses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {clauses.length === 0 ? (
          <EmptyState
            icon={<BookTemplate className="mx-auto h-12 w-12 text-gray-400" />}
            title="No clauses found"
            description="Get started by creating a new clause."
            action={{ label: 'Create Clause', onClick: () => handleOpenModal() }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Name & Category</th>
                  <th className="px-6 py-3 font-medium">Content Preview</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clauses.map((clause: Clause) => (
                  <tr key={clause.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="font-medium text-gray-900 truncate" title={clause.name}>{clause.name}</div>
                      <div className="text-gray-500 text-xs mt-1">{clause.category}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="truncate text-gray-500" title={clause.text_content}>
                        {clause.text_content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={clause.is_standard ? 'indigo' : 'gray'}>
                        {clause.is_standard ? 'Standard' : 'Custom'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(clause)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteId(clause.id)}>
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

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingClause ? 'Edit Clause' : 'Create Clause'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input {...register('name')} error={errors.name?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Input {...register('category')} error={errors.category?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              {...register('text_content')}
              className={`w-full rounded-md border shadow-sm p-2 text-sm ${errors.text_content ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
              rows={4}
            />
            {errors.text_content && <p className="text-red-500 text-xs mt-1">{errors.text_content.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_standard" {...register('is_standard')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="is_standard" className="text-sm text-gray-700">Standard Clause</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingClause ? 'Save Changes' : 'Create Clause'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Clause"
        message="Are you sure you want to delete this clause? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
