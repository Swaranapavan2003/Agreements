import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { useOrganization, useUpdateOrganization, useDepartments, useCreateDepartment, useDeleteDepartment, useOrganizationSettings, useUpdateSettings } from '@/hooks/useOrganization'
import { FolderPlus, Trash2, Building2, Settings } from 'lucide-react'
import type { Department } from '@/types/organization.types'

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'departments', label: 'Departments' },
  { id: 'settings', label: 'Agreement Settings' },
]

const orgSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().optional(),
})

const deptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

type OrgFormData = z.infer<typeof orgSchema>
type DeptFormData = z.infer<typeof deptSchema>
type SettingsFormData = {
  agreement_number_prefix: string;
  default_currency: string;
  timezone: string;
}

export function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [deleteDept, setDeleteDept] = useState<Department | null>(null)

  const { data: org } = useOrganization()
  const updateOrg = useUpdateOrganization()
  const { data: departments = [] } = useDepartments()
  const createDept = useCreateDepartment()
  const deleteDeptMutation = useDeleteDepartment()
  const { data: settings } = useOrganizationSettings()
  const updateSettings = useUpdateSettings()

  const orgForm = useForm<OrgFormData>({ resolver: zodResolver(orgSchema), values: { name: org?.name || '', email: org?.email || '', phone: org?.phone || '', website: org?.website || '' } })
  const deptForm = useForm<DeptFormData>({ resolver: zodResolver(deptSchema) })
  const settingsForm = useForm<SettingsFormData>({ values: { agreement_number_prefix: settings?.agreement_number_prefix || 'AGR', default_currency: 'INR', timezone: settings?.timezone || 'Asia/Kolkata' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your organization profile and preferences</p>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'general' && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-6">Organization Profile</h2>
          <form onSubmit={orgForm.handleSubmit(data => updateOrg.mutate(data))} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Organization name" error={orgForm.formState.errors.name?.message} required {...orgForm.register('name')} />
            <Input label="Email address" type="email" error={orgForm.formState.errors.email?.message} required {...orgForm.register('email')} />
            <Input label="Phone" type="tel" {...orgForm.register('phone')} />
            <Input label="Website" type="url" {...orgForm.register('website')} />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" loading={updateOrg.isPending}>Save Changes</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button leftIcon={<FolderPlus className="h-4 w-4" />} onClick={() => setShowDeptModal(true)}>Add Department</Button>
          </div>
          {departments.length === 0 ? (
            <Card><EmptyState icon={<Building2 className="h-8 w-8" />} title="No departments yet" description="Create departments to organize your team" action={{ label: 'Add Department', onClick: () => setShowDeptModal(true) }} /></Card>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {departments.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{d.description || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={d.is_active ? 'success' : 'gray'} size="sm">{d.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteDept(d)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-6">Agreement Settings</h2>
          <form onSubmit={settingsForm.handleSubmit(data => updateSettings.mutate(data))} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Agreement number prefix" placeholder="AGR" helperText='e.g. AGR → AGR-2026-0001' {...settingsForm.register('agreement_number_prefix')} />
            <Input label="Default currency" value="INR" disabled helperText="Indian Rupee (₹)" />
            <Input label="Timezone" {...settingsForm.register('timezone')} />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" loading={updateSettings.isPending}>Save Settings</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Add Department Modal */}
      <Modal open={showDeptModal} onClose={() => { setShowDeptModal(false); deptForm.reset() }} title="Add Department" size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowDeptModal(false); deptForm.reset() }}>Cancel</Button>
            <Button form="dept-form" type="submit" loading={createDept.isPending}>Create</Button>
          </>
        }
      >
        <form id="dept-form" onSubmit={deptForm.handleSubmit(data => createDept.mutate(data, { onSuccess: () => { setShowDeptModal(false); deptForm.reset() } }))} className="space-y-4">
          <Input label="Department name" required error={deptForm.formState.errors.name?.message} {...deptForm.register('name')} />
          <Input label="Description" {...deptForm.register('description')} />
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteDept}
        onClose={() => setDeleteDept(null)}
        onConfirm={() => { if (deleteDept) deleteDeptMutation.mutate(deleteDept.id, { onSuccess: () => setDeleteDept(null) }) }}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteDept?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteDeptMutation.isPending}
      />
    </div>
  )
}
