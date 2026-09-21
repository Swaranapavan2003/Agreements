import { useState, useCallback } from 'react';
import { aiService } from '../services/ai.service';
import { RiskAnalysis, MetadataExtraction, ChatMessage, AIDraftRequest } from '../types/ai.types';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeRisk = useCallback(async (agreementId: string): Promise<RiskAnalysis | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.analyzeRisk(agreementId);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze risk');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const extractMetadata = useCallback(async (file: File): Promise<MetadataExtraction[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.extractMetadata(file);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to extract metadata');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const askQuestion = useCallback(async (agreementId: string, message: string): Promise<ChatMessage | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.askQuestion(agreementId, message);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to ask question');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const magicDraft = useCallback(async (request: AIDraftRequest): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.magicDraft(request);
      return result.draft;
    } catch (err: any) {
      setError(err.message || 'Failed to generate draft');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    analyzeRisk,
    extractMetadata,
    askQuestion,
    magicDraft
  };
}
