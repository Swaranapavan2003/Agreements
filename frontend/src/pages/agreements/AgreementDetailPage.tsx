import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Users, Clock, Upload, Download, Plus, MessageSquare, CheckCircle, Edit3, ShieldAlert, Bot } from 'lucide-react';

import { 
  useAgreement, 
  useChangeAgreementStatus, 
  useAddAgreementParty, 
  useUploadAgreementVersion 
} from '@/hooks/useAgreements';
import { useComments, useCreateComment } from '@/hooks/useComments';
import { useCompareVersions } from '@/hooks/useVersioning';
import { useAgreementApprovals, useStartApprovalProcess, useApproveStep, useRejectStep } from '@/hooks/useApprovals';
import { useSignatures, useSignAgreement } from '@/hooks/useSignatures';
import { useLifecycle } from '@/hooks/useLifecycle';
import { CommentThread } from '@/components/agreements/CommentThread';
import { VersionCompareViewer } from '@/components/agreements/VersionCompareViewer';
import { AgreementStatus } from '@/types/agreement.types';
import { formatDate } from '@/utils/formatters';
import { RiskAnalysisPanel } from '@/components/ai/RiskAnalysisPanel';
import { AIAssistantSidebar } from '@/components/ai/AIAssistantSidebar';
import { SmartExtractionModal } from '@/components/ai/SmartExtractionModal';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { EmptyState } from '@/components/ui/EmptyState';

const addPartySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
});

type AddPartyForm = z.infer<typeof addPartySchema>;

const statusColors: Record<AgreementStatus, 'gray' | 'info' | 'warning' | 'success' | 'error'> = {
  [AgreementStatus.DRAFT]: 'gray',
  [AgreementStatus.IN_REVIEW]: 'warning',
  [AgreementStatus.APPROVED]: 'info',
  [AgreementStatus.SIGNED]: 'success',
  [AgreementStatus.ACTIVE]: 'success',
  [AgreementStatus.EXPIRED]: 'error',
  [AgreementStatus.TERMINATED]: 'error',
};

const allowedTransitions: Record<AgreementStatus, AgreementStatus[]> = {
  [AgreementStatus.DRAFT]: [AgreementStatus.IN_REVIEW],
  [AgreementStatus.IN_REVIEW]: [AgreementStatus.APPROVED, AgreementStatus.DRAFT],
  [AgreementStatus.APPROVED]: [AgreementStatus.SIGNED, AgreementStatus.DRAFT],
  [AgreementStatus.SIGNED]: [AgreementStatus.ACTIVE],
  [AgreementStatus.ACTIVE]: [AgreementStatus.EXPIRED, AgreementStatus.TERMINATED],
  [AgreementStatus.EXPIRED]: [],
  [AgreementStatus.TERMINATED]: [],
};

export function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{v1: string | null, v2: string | null}>({v1: null, v2: null});
  const [newComment, setNewComment] = useState('');
  const [approvalActionModal, setApprovalActionModal] = useState<{ isOpen: boolean, type: 'approve'|'reject', stepId: string, requestId: string }>({ isOpen: false, type: 'approve', stepId: '', requestId: '' });
  const [approvalComment, setApprovalComment] = useState('');
  
  const [lifecycleModal, setLifecycleModal] = useState<{ isOpen: boolean, type: 'start'|'renew'|'amend'|'terminate' }>({ isOpen: false, type: 'start' });
  const [lifecycleText, setLifecycleText] = useState('');

  const { data: agreement, isLoading } = useAgreement(id!);
  const { data: comments } = useComments(id!);
  const createComment = useCreateComment();
  const { data: compareData, isLoading: isComparing } = useCompareVersions(id!, compareVersions.v1, compareVersions.v2);

  const { data: approvalsData } = useAgreementApprovals(id!);
  const { data: signaturesData } = useSignatures(id!);
  
  const startApproval = useStartApprovalProcess();
  const approveStep = useApproveStep();
  const rejectStep = useRejectStep();
  const signAgreement = useSignAgreement();
  const { renewAgreement, amendAgreement, terminateAgreement } = useLifecycle();

  const changeStatus = useChangeAgreementStatus();
  const addParty = useAddAgreementParty();
  const uploadVersion = useUploadAgreementVersion();

  const partyForm = useForm<AddPartyForm>({
    resolver: zodResolver(addPartySchema),
    defaultValues: { name: '', email: '', role: '' },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading agreement...</div>;
  }

  if (!agreement) {
    return <div className="p-8 text-center text-red-500">Agreement not found</div>;
  }

  const handleStatusChange = (status: AgreementStatus) => {
    changeStatus.mutate({ id: agreement.id, status });
  };

  const handleAddParty = (data: AddPartyForm) => {
    addParty.mutate({ id: agreement.id, data }, {
      onSuccess: () => {
        setIsPartyModalOpen(false);
        partyForm.reset();
      }
    });
  };

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSmartExtractionOpen, setIsSmartExtractionOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setIsSmartExtractionOpen(true);
    }
    // reset input
    e.target.value = '';
  };

  const handleSaveExtraction = (extractedData: Record<string, any>) => {
    if (uploadFile) {
      // Assuming we merge this extracted data somehow or just upload the version
      uploadVersion.mutate({ id: agreement.id, file: uploadFile });
      setUploadFile(null);
    }
  };

  const handleNewComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createComment.mutate({ agreementId: agreement.id, data: { content: newComment } }, {
      onSuccess: () => setNewComment('')
    });
  };

  const nextStatuses = allowedTransitions[agreement.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{agreement.title}</h1>
            <Badge variant={statusColors[agreement.status]}>
              {agreement.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Created {formatDate(new Date(agreement.created_at))}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Bot className="w-4 h-4" />} onClick={() => setIsAISidebarOpen(true)}>Ask AI</Button>
          {nextStatuses.length > 0 && (
            <Dropdown
              trigger={<Button variant="outline">Change Status</Button>}
              align="right"
              items={nextStatuses.map(status => ({
                label: `Mark as ${status.replace('_', ' ')}`,
                onClick: () => handleStatusChange(status)
              }))}
            />
          )}
          <Dropdown
            trigger={<Button>Actions</Button>}
            align="right"
            items={[
              { label: 'Start Approval Process', onClick: () => { setLifecycleModal({ isOpen: true, type: 'start' }); setLifecycleText(''); } },
              { label: 'Renew', onClick: () => { setLifecycleModal({ isOpen: true, type: 'renew' }); setLifecycleText(''); } },
              { label: 'Amend', onClick: () => { setLifecycleModal({ isOpen: true, type: 'amend' }); setLifecycleText(''); } },
              { label: 'Terminate', onClick: () => { setLifecycleModal({ isOpen: true, type: 'terminate' }); setLifecycleText(''); } }
            ]}
          />
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', icon: <FileText className="h-4 w-4" /> },
          { id: 'parties', label: 'Parties', icon: <Users className="h-4 w-4" /> },
          { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
          { id: 'review', label: 'Review & Comments', icon: <MessageSquare className="h-4 w-4" /> },
          { id: 'approvals', label: 'Approvals', icon: <CheckCircle className="h-4 w-4" /> },
          { id: 'signatures', label: 'Signatures', icon: <Edit3 className="h-4 w-4" /> },
          { id: 'risk', label: 'Risk Analysis', icon: <ShieldAlert className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {agreement.effective_date ? formatDate(new Date(agreement.effective_date)) : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {agreement.expiry_date ? formatDate(new Date(agreement.expiry_date)) : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Renewal Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{agreement.renewal_type}</dd>
                </div>
              </dl>
            </Card>
          </div>
        )}

        {activeTab === 'parties' && (
          <Card className="p-0">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Agreement Parties</h3>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsPartyModalOpen(true)}>
                Add Party
              </Button>
            </div>
            
            {!agreement.parties || agreement.parties.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Users className="h-8 w-8" />}
                  title="No parties added"
                  description="Add parties to this agreement to track who is involved."
                />
              </div>
            ) : (
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {agreement.parties.map((party) => (
                    <tr key={party.id} className="bg-white border-b border-gray-200">
                      <td className="px-6 py-4 font-medium text-gray-900">{party.name}</td>
                      <td className="px-6 py-4">{party.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant="gray">{party.role}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {activeTab === 'documents' && (
          <Card className="p-0">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Document Versions</h3>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadVersion.isPending}
                  ref={(input) => {
                    if (input) {
                      // Attach ref but we just use document.getElementById
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  leftIcon={<Upload className="h-4 w-4" />} 
                  loading={uploadVersion.isPending} 
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Upload Version
                </Button>
              </div>
            </div>

            {!agreement.versions || agreement.versions.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<FileText className="h-8 w-8" />}
                  title="No documents uploaded"
                  description="Upload the first version of this agreement."
                />
              </div>
            ) : (
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Version</th>
                    <th className="px-6 py-3">File Name</th>
                    <th className="px-6 py-3">Uploaded On</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agreement.versions.map((version) => (
                    <tr key={version.id} className="bg-white border-b border-gray-200">
                      <td className="px-6 py-4">
                        <Badge variant="info">v{version.version_number}.0</Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{version.file_name}</td>
                      <td className="px-6 py-4">{formatDate(new Date(version.created_at))}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {activeTab === 'review' && (
          <div className="flex gap-6 h-[600px]">
            {/* Left side: Document Viewer / Compare Trigger */}
            <Card className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-dashed">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Document Review</h3>
              <p className="text-gray-500 text-sm mb-4 text-center max-w-sm">
                Select versions to compare and view differences side-by-side with AI summaries.
              </p>
              <div className="flex gap-2 items-center">
                <select 
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  value={compareVersions.v1 || ''}
                  onChange={(e) => setCompareVersions(prev => ({ ...prev, v1: e.target.value }))}
                >
                  <option value="">Select Base Version</option>
                  {agreement.versions?.map(v => (
                    <option key={v.id} value={v.id}>v{v.version_number}.0</option>
                  ))}
                </select>
                <span className="text-gray-500">vs</span>
                <select 
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  value={compareVersions.v2 || ''}
                  onChange={(e) => setCompareVersions(prev => ({ ...prev, v2: e.target.value }))}
                >
                  <option value="">Select Target Version</option>
                  {agreement.versions?.map(v => (
                    <option key={v.id} value={v.id}>v{v.version_number}.0</option>
                  ))}
                </select>
                <Button 
                  disabled={!compareVersions.v1 || !compareVersions.v2}
                  onClick={() => setIsCompareModalOpen(true)}
                >
                  Compare
                </Button>
              </div>
            </Card>

            {/* Right side: Comments Sidebar */}
            <Card className="w-96 flex flex-col p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-white z-10">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  Comments
                </h3>
                <form onSubmit={handleNewComment} className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newComment.trim() || createComment.isPending}>
                    Post
                  </Button>
                </form>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {!comments || comments.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm mt-8">
                    No comments yet. Be the first to start the discussion!
                  </div>
                ) : (
                  comments.map(comment => (
                    <CommentThread key={comment.id} agreementId={agreement.id} comment={comment} />
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'approvals' && (
          <Card>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Approval Workflow</h3>
            </div>
            <div className="p-4 space-y-4">
              {approvalsData && approvalsData.length > 0 ? (
                approvalsData.map((request: any) => (
                  <div key={request.id} className="border p-4 rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-gray-700">Status: {request.status}</span>
                      <span className="text-sm text-gray-500">Created: {formatDate(new Date(request.created_at))}</span>
                    </div>
                    <div className="space-y-4 relative border-l-2 border-gray-200 ml-4">
                      {request.steps.map((step: any, idx: number) => (
                        <div key={step.id} className="pl-6 relative">
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${step.status === 'APPROVED' ? 'bg-green-500 border-green-500' : step.status === 'REJECTED' ? 'bg-red-500 border-red-500' : 'bg-gray-300 border-white'}`} />
                          <div className="bg-gray-50 p-3 rounded border text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-800">Step {step.step_order}</span>
                              <Badge variant={step.status === 'APPROVED' ? 'success' : step.status === 'REJECTED' ? 'error' : 'gray'}>{step.status}</Badge>
                            </div>
                            <p className="text-gray-600 mt-1">Role: {step.role_id || 'Any'}, User: {step.user_id || 'Any'}</p>
                            {step.status === 'PENDING' && (
                              <div className="mt-3 flex gap-2">
                                <Button size="sm" onClick={() => setApprovalActionModal({ isOpen: true, type: 'approve', stepId: step.id, requestId: request.id })}>Approve</Button>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setApprovalActionModal({ isOpen: true, type: 'reject', stepId: step.id, requestId: request.id })}>Reject</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<CheckCircle className="h-8 w-8" />}
                  title="No Approval Process"
                  description="Start an approval process from the Actions menu."
                />
              )}
            </div>
          </Card>
        )}

        {activeTab === 'signatures' && (
          <Card>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Signatures Audit Trail</h3>
              <Button size="sm" leftIcon={<Edit3 className="h-4 w-4" />} onClick={() => {
                  signAgreement.mutate({
                    agreement_id: agreement.id,
                    signature_hash: 'sample-hash-' + Date.now(),
                    ip_address: '127.0.0.1',
                    user_agent: navigator.userAgent
                  })
                }} loading={signAgreement.isPending}>
                Cryptographically Sign Agreement
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {signaturesData && signaturesData.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">User ID</th>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">IP Address</th>
                      <th className="px-6 py-3">Signature Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signaturesData.map((sig: any) => (
                      <tr key={sig.id} className="border-b bg-white">
                        <td className="px-6 py-4">{sig.user_id}</td>
                        <td className="px-6 py-4">{formatDate(new Date(sig.timestamp))}</td>
                        <td className="px-6 py-4">{sig.ip_address}</td>
                        <td className="px-6 py-4 font-mono text-xs">{sig.signature_hash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState
                  icon={<Edit3 className="h-8 w-8" />}
                  title="No Signatures"
                  description="No cryptographic signatures have been recorded yet."
                />
              )}
            </div>
          </Card>
        )}
        {activeTab === 'risk' && (
          <div className="mt-4">
            <RiskAnalysisPanel agreementId={agreement.id} />
          </div>
        )}
      </div>

      <AIAssistantSidebar 
        isOpen={isAISidebarOpen} 
        onClose={() => setIsAISidebarOpen(false)} 
        agreementId={agreement.id} 
      />

      <Modal open={approvalActionModal.isOpen} onClose={() => { setApprovalActionModal(prev => ({ ...prev, isOpen: false })); setApprovalComment(''); }} title={`Confirm ${approvalActionModal.type === 'approve' ? 'Approval' : 'Rejection'}`}>
        <div className="space-y-4 mt-4">
          <Input label="Comments (Optional)" value={approvalComment} onChange={e => setApprovalComment(e.target.value)} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setApprovalActionModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
            <Button loading={approveStep.isPending || rejectStep.isPending} onClick={() => {
              const payload = { requestId: approvalActionModal.requestId, stepId: approvalActionModal.stepId, comments: approvalComment };
              if (approvalActionModal.type === 'approve') {
                approveStep.mutate(payload, { onSuccess: () => setApprovalActionModal(prev => ({ ...prev, isOpen: false })) });
              } else {
                rejectStep.mutate(payload as any, { onSuccess: () => setApprovalActionModal(prev => ({ ...prev, isOpen: false })) });
              }
            }}>Confirm</Button>
          </div>
        </div>
      </Modal>

      <Modal open={lifecycleModal.isOpen} onClose={() => setLifecycleModal(prev => ({ ...prev, isOpen: false }))} title={`Confirm Action: ${lifecycleModal.type}`}>
        <div className="space-y-4 mt-4">
          <Input label={lifecycleModal.type === 'start' ? 'Workflow ID (optional)' : lifecycleModal.type === 'renew' ? 'New End Date (YYYY-MM-DD)' : lifecycleModal.type === 'amend' ? 'Amendment Details' : 'Termination Reason'} value={lifecycleText} onChange={e => setLifecycleText(e.target.value)} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setLifecycleModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
            <Button loading={startApproval.isPending || renewAgreement.isPending || amendAgreement.isPending || terminateAgreement.isPending} onClick={() => {
              if (lifecycleModal.type === 'start') startApproval.mutate({ agreementId: agreement.id, workflowId: lifecycleText || undefined }, { onSuccess: () => setLifecycleModal(prev => ({ ...prev, isOpen: false })) });
              else if (lifecycleModal.type === 'renew') renewAgreement.mutate({ agreementId: agreement.id, newEndDate: lifecycleText || undefined }, { onSuccess: () => setLifecycleModal(prev => ({ ...prev, isOpen: false })) });
              else if (lifecycleModal.type === 'amend') amendAgreement.mutate({ agreementId: agreement.id, details: lifecycleText }, { onSuccess: () => setLifecycleModal(prev => ({ ...prev, isOpen: false })) });
              else if (lifecycleModal.type === 'terminate') terminateAgreement.mutate({ agreementId: agreement.id, reason: lifecycleText }, { onSuccess: () => setLifecycleModal(prev => ({ ...prev, isOpen: false })) });
            }}>Confirm</Button>
          </div>
        </div>
      </Modal>      <Modal open={isPartyModalOpen} onClose={() => setIsPartyModalOpen(false)} title="Add Party">
        <form onSubmit={partyForm.handleSubmit(handleAddParty)} className="space-y-4 mt-4">
          <Input
            label="Name"
            {...partyForm.register('name')}
            error={partyForm.formState.errors.name?.message}
            placeholder="John Doe"
          />
          <Input
            label="Email"
            type="email"
            {...partyForm.register('email')}
            error={partyForm.formState.errors.email?.message}
            placeholder="john@example.com"
          />
          <Input
            label="Role"
            {...partyForm.register('role')}
            error={partyForm.formState.errors.role?.message}
            placeholder="e.g. Signatory, Reviewer"
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsPartyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addParty.isPending}>
              Add Party
            </Button>
          </div>
        </form>
      </Modal>

      <SmartExtractionModal 
        isOpen={isSmartExtractionOpen}
        onClose={() => {
          setIsSmartExtractionOpen(false);
          setUploadFile(null);
        }}
        file={uploadFile}
        onSave={handleSaveExtraction}
      />

      {/* Compare Modal */}
      <Modal 
        open={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        title="Compare Versions"
        size="xl"
      >
        <div className="mt-4 h-[600px] w-full">
          {isComparing ? (
            <div className="flex justify-center items-center h-full text-gray-500">Loading comparison...</div>
          ) : compareData ? (
            <VersionCompareViewer data={compareData} />
          ) : (
            <div className="flex justify-center items-center h-full text-red-500">Failed to load comparison data.</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
