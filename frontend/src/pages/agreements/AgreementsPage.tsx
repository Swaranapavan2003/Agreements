import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, FileText, Filter } from 'lucide-react';

import { useAgreements, useCreateAgreement } from '@/hooks/useAgreements';
import { AgreementStatus, RenewalType } from '@/types/agreement.types';
import { formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';

const createAgreementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  effective_date: z.string().optional(),
  expiry_date: z.string().optional(),
  renewal_type: z.nativeEnum(RenewalType).optional(),
});

type CreateAgreementForm = z.infer<typeof createAgreementSchema>;

const statusColors: Record<AgreementStatus, 'gray' | 'info' | 'warning' | 'success' | 'error'> = {
  [AgreementStatus.DRAFT]: 'gray',
  [AgreementStatus.IN_REVIEW]: 'warning',
  [AgreementStatus.APPROVED]: 'info',
  [AgreementStatus.SIGNED]: 'success',
  [AgreementStatus.ACTIVE]: 'success',
  [AgreementStatus.EXPIRED]: 'error',
  [AgreementStatus.TERMINATED]: 'error',
};

export function AgreementsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: agreements = [], isLoading } = useAgreements();
  const createAgreement = useCreateAgreement();

  const form = useForm<CreateAgreementForm>({
    resolver: zodResolver(createAgreementSchema),
    defaultValues: {
      title: '',
      renewal_type: RenewalType.NONE,
    },
  });

  const onSubmit = (data: CreateAgreementForm) => {
    createAgreement.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        form.reset();
      },
    });
  };

  const filteredAgreements = agreements.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agreements</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all your organization's agreements in one place.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
          New Agreement
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search agreements..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border-gray-300 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {Object.values(AgreementStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading agreements...</div>
        ) : filteredAgreements.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No agreements found"
              description={searchTerm || statusFilter !== 'ALL' ? "Try adjusting your filters" : "Get started by creating your first agreement"}
              action={
                !(searchTerm || statusFilter !== 'ALL') ? {
                  label: 'Create Agreement',
                  onClick: () => setIsModalOpen(true),
                  icon: <Plus className="h-4 w-4" />
                } : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Effective Date</th>
                  <th className="px-6 py-3">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.map((agreement) => (
                  <tr
                    key={agreement.id}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/agreements/${agreement.id}`)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {agreement.title}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusColors[agreement.status]}>
                        {agreement.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {agreement.effective_date ? formatDate(new Date(agreement.effective_date)) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {agreement.expiry_date ? formatDate(new Date(agreement.expiry_date)) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Agreement">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <Input
            label="Agreement Title"
            {...form.register('title')}
            error={form.formState.errors.title?.message}
            placeholder="e.g. Master Service Agreement"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Effective Date"
              {...form.register('effective_date')}
              error={form.formState.errors.effective_date?.message}
            />
            <Input
              type="date"
              label="Expiry Date"
              {...form.register('expiry_date')}
              error={form.formState.errors.expiry_date?.message}
            />
          </div>

          <Controller
            control={form.control}
            name="renewal_type"
            render={({ field, fieldState }) => (
              <Select
                label="Renewal Type"
                value={field.value || ''}
                onChange={field.onChange}
                error={fieldState.error?.message}
                options={[
                  { label: 'None', value: RenewalType.NONE },
                  { label: 'Auto Renewal', value: RenewalType.AUTO },
                  { label: 'Manual Renewal', value: RenewalType.MANUAL },
                ]}
              />
            )}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createAgreement.isPending}>
              Create Agreement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
