import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ArrowLeft, LayoutTemplate, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'

import { useTemplate, useCreateTemplate, useUpdateTemplate } from '@/hooks/useTemplates'
import { useClauses } from '@/hooks/useClauses'
import { useAI } from '@/hooks/useAI'

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  html_content: z.string(),
  is_active: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

export function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  const [activeTab, setActiveTab] = useState('clauses')

  const { data: templateData, isLoading: isLoadingTemplate } = useTemplate(id as string)
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  
  const { data: clausesData } = useClauses({ per_page: 50 })
  const clauses = clausesData?.data.items || []

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      html_content: '',
      is_active: false,
    }
  })
  
  const htmlContent = watch('html_content') || ''
  
  const [isMagicDraftOpen, setIsMagicDraftOpen] = useState(false)
  const [magicDraftPrompt, setMagicDraftPrompt] = useState('')
  const { magicDraft, loading: isAILoading } = useAI()

  useEffect(() => {
    if (isEditing && templateData?.data) {
      reset({
        name: templateData.data.name,
        description: templateData.data.description || '',
        html_content: templateData.data.html_content || '',
        is_active: templateData.data.is_active,
      })
    }
  }, [isEditing, templateData, reset])

  const handleMagicDraft = async () => {
    if (!magicDraftPrompt.trim()) return;
    const draft = await magicDraft({ prompt: magicDraftPrompt });
    if (draft) {
      insertClause(draft);
      setIsMagicDraftOpen(false);
      setMagicDraftPrompt('');
    }
  };

  const onSubmit = (data: TemplateFormData) => {
    if (isEditing) {
      updateMutation.mutate({ id: id as string, data }, {
        onSuccess: () => navigate('/templates')
      })
    } else {
      createMutation.mutate(data, {
        onSuccess: () => navigate('/templates')
      })
    }
  }

  const insertClause = (text: string) => {
    setValue('html_content', htmlContent + '\n\n' + text)
  }

  if (isEditing && isLoadingTemplate) return <FullPageSpinner />

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSubmit((d) => onSubmit({ ...d, is_active: false }))}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            leftIcon={<Save className="h-4 w-4" />}
            onClick={handleSubmit((d) => onSubmit({ ...d, is_active: true }))}
            loading={createMutation.isPending || updateMutation.isPending}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className="w-1/4 flex flex-col gap-4 overflow-y-auto">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input {...register('name')} error={errors.name?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input {...register('description')} error={errors.description?.message} />
              </div>
            </div>
          </Card>

          <Card className="flex-1 p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Library</h2>
              <Button 
                size="sm" 
                variant="outline" 
                leftIcon={<Sparkles className="h-4 w-4 text-indigo-500" />}
                onClick={() => setIsMagicDraftOpen(true)}
              >
                Magic Draft AI
              </Button>
            </div>
            <div className="px-4 pt-2">
              <Tabs
                tabs={[
                  { id: 'clauses', label: 'Clauses' },
                  { id: 'fields', label: 'Fields' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
            {activeTab === 'clauses' ? (
              <div className="p-4 overflow-y-auto h-full space-y-2">
                {clauses.map(clause => (
                  <div key={clause.id} className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => insertClause(clause.text_content)}>
                    <div className="font-medium text-sm">{clause.name}</div>
                    <div className="text-xs text-gray-500 truncate">{clause.text_content}</div>
                  </div>
                ))}
                {clauses.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">No clauses available.</div>
                )}
              </div>
            ) : (
              <div className="p-4 overflow-y-auto h-full space-y-2">
                {['{{Party_A}}', '{{Party_B}}', '{{Effective_Date}}', '{{Amount}}'].map(field => (
                  <div key={field} className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => insertClause(field)}>
                    <code className="text-sm text-indigo-600">{field}</code>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="flex-1 p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center bg-gray-50">
            <LayoutTemplate className="h-5 w-5 mr-2 text-gray-500" />
            <span className="font-medium text-gray-700">Editor</span>
          </div>
          <div className="flex-1 p-4 bg-gray-100">
            <textarea
              {...register('html_content')}
              className="w-full h-full p-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none font-mono text-sm"
              placeholder="Write your template HTML or markdown here..."
            />
          </div>
        </Card>
      </div>

      <Modal open={isMagicDraftOpen} onClose={() => setIsMagicDraftOpen(false)} title="Magic Draft AI">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">
            Describe the clause you want to generate, and our AI will draft it for you.
          </p>
          <Input 
            value={magicDraftPrompt}
            onChange={(e) => setMagicDraftPrompt(e.target.value)}
            placeholder="e.g. A mutual non-disclosure clause governing confidential information..."
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsMagicDraftOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleMagicDraft} 
              loading={isAILoading}
              disabled={!magicDraftPrompt.trim()}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Generate Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
