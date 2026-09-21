import React, { useEffect, useState } from 'react';
import { Sparkles, Save, X } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { MetadataExtraction } from '../../types/ai.types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface SmartExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onSave: (data: Record<string, any>) => void;
}

export const SmartExtractionModal: React.FC<SmartExtractionModalProps> = ({ isOpen, onClose, file, onSave }) => {
  const { extractMetadata, loading, error } = useAI();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [extractions, setExtractions] = useState<MetadataExtraction[]>([]);

  useEffect(() => {
    if (isOpen && file) {
      loadExtractions();
    }
  }, [isOpen, file]);

  const loadExtractions = async () => {
    if (!file) return;
    const result = await extractMetadata(file);
    if (result) {
      setExtractions(result);
      const initialFields: Record<string, string> = {};
      result.forEach(ext => {
        initialFields[ext.field] = String(ext.value);
      });
      setFields(initialFields);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(fields);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Smart Data Extraction">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-indigo-800">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <p className="text-sm">
            AI has analyzed your document and extracted the following key information. Please review and edit if necessary before saving.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500">Extracting fields...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {extractions.map((ext) => (
              <div key={ext.id} className="relative">
                <Input
                  label={ext.field}
                  value={fields[ext.field] || ''}
                  onChange={(e) => handleFieldChange(ext.field, e.target.value)}
                />
                {ext.confidence < 0.9 && (
                  <span className="absolute top-0 right-0 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded mt-1">
                    Low Confidence
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Review & Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
