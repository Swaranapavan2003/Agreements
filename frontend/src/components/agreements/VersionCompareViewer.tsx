import { CompareVersionsResponse } from '@/services/versioning.service';
import { Alert } from '@/components/ui/Alert';
import { Sparkles, FileText, SplitSquareHorizontal } from 'lucide-react';
import { useState } from 'react';

interface VersionCompareViewerProps {
  data: CompareVersionsResponse;
}

export function VersionCompareViewer({ data }: VersionCompareViewerProps) {
  const [viewMode, setViewMode] = useState<'inline' | 'split'>('split');

  // A very basic diff parser for demo purposes. 
  // In a real app, diff_text would be parsed into additions/deletions, 
  // or returned as a structured array from the backend.
  // Assuming diff_text has lines starting with + or - for changes.
  const lines = data.diff_text ? data.diff_text.split('\n') : [];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          Version Comparison
        </h3>
        <div className="flex items-center gap-2 bg-white rounded-md border border-gray-300 p-1">
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded ${viewMode === 'inline' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setViewMode('inline')}
          >
            Inline
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm font-medium rounded flex items-center gap-1 ${viewMode === 'split' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setViewMode('split')}
          >
            <SplitSquareHorizontal className="w-4 h-4" />
            Split
          </button>
        </div>
      </div>

      {data.ai_summary && (
        <div className="p-4 border-b border-gray-200 bg-indigo-50/50">
          <Alert
            title="AI Summary of Changes"
            variant="info"
            message={data.ai_summary}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 bg-gray-50 font-mono text-sm">
        {viewMode === 'inline' ? (
          <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
            {lines.map((line, i) => {
              let lineClass = 'text-gray-800';
              let bgClass = '';
              if (line.startsWith('+')) {
                lineClass = 'text-green-800';
                bgClass = 'bg-green-100/50';
              } else if (line.startsWith('-')) {
                lineClass = 'text-red-800';
                bgClass = 'bg-red-100/50';
              }
              return (
                <div key={i} className={`whitespace-pre-wrap py-0.5 px-2 ${bgClass} ${lineClass}`}>
                  {line}
                </div>
              );
            })}
            {lines.length === 0 && <div className="text-gray-500 italic">No differences found or diff text empty.</div>}
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1 bg-white border border-gray-200 rounded p-4 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 border-b pb-2">Version 1</h4>
              {lines.map((line, i) => {
                if (line.startsWith('+')) return null;
                const isRemoved = line.startsWith('-');
                return (
                  <div key={i} className={`whitespace-pre-wrap py-0.5 px-2 ${isRemoved ? 'bg-red-100/50 text-red-800' : 'text-gray-800'}`}>
                    {line}
                  </div>
                );
              })}
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded p-4 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 border-b pb-2">Version 2</h4>
              {lines.map((line, i) => {
                if (line.startsWith('-')) return null;
                const isAdded = line.startsWith('+');
                return (
                  <div key={i} className={`whitespace-pre-wrap py-0.5 px-2 ${isAdded ? 'bg-green-100/50 text-green-800' : 'text-gray-800'}`}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
