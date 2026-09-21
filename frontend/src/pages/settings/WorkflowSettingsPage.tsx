import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Save } from 'lucide-react'
import { useCreateWorkflow, useWorkflows } from '@/hooks/useApprovals'
import { toast } from 'react-hot-toast'

const stepSchema = z.object({
  step_order: z.number(),
  role_id: z.string().optional(),
  user_id: z.string().optional(),
  is_parallel: z.boolean(),
})

const workflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
  steps: z.array(stepSchema).min(1, 'At least one step is required'),
})

type WorkflowFormData = z.infer<typeof workflowSchema>

export function WorkflowSettingsPage() {
  const { data: workflowsData, isLoading } = useWorkflows()
  const { mutateAsync: createWorkflow, isPending } = useCreateWorkflow()

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      steps: [{ step_order: 1, role_id: '', user_id: '', is_parallel: false }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'steps',
  })

  const onSubmit = async (data: WorkflowFormData) => {
    try {
      await createWorkflow(data as any)
      toast.success('Workflow created successfully')
      reset()
    } catch (error) {
      toast.error('Failed to create workflow')
    }
  }

  if (isLoading) return <div>Loading workflows...</div>

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Approval Workflows</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold mb-4">Create New Workflow</h2>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Workflow Name</label>
              <input
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. Standard NDA Approval"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                {...register('description')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Optional description"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Approval Steps</label>
              <button
                type="button"
                onClick={() => append({ step_order: fields.length + 1, role_id: '', user_id: '', is_parallel: false })}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </button>
            </div>
            {errors.steps && <p className="text-red-500 text-sm mb-2">{errors.steps.message}</p>}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-md">
                  <span className="font-medium text-gray-500 w-16">Step {index + 1}</span>
                  
                  <input type="hidden" {...register(`steps.${index}.step_order`, { valueAsNumber: true })} value={index + 1} />
                  
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <input
                        {...register(`steps.${index}.role_id`)}
                        placeholder="Role ID (e.g. Legal)"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <input
                        {...register(`steps.${index}.user_id`)}
                        placeholder="User ID (optional)"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register(`steps.${index}.is_parallel`)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Parallel</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Saving...' : 'Save Workflow'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Existing Workflows</h2>
        <div className="space-y-4">
          {workflowsData?.items?.map((workflow: any) => (
            <div key={workflow.id} className="border-b pb-4 last:border-b-0 last:pb-0">
              <h3 className="font-medium text-gray-900">{workflow.name}</h3>
              {workflow.description && <p className="text-sm text-gray-500">{workflow.description}</p>}
              <div className="mt-2 text-sm text-gray-600">
                {workflow.steps?.length || 0} steps defined
              </div>
            </div>
          ))}
          {(!workflowsData?.items || workflowsData.items.length === 0) && (
            <p className="text-sm text-gray-500">No workflows found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
