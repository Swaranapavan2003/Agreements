export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface FlaggedClause {
  id: string;
  clauseText: string;
  riskLevel: RiskLevel;
  explanation: string;
  suggestion?: string;
}

export interface RiskAnalysis {
  overallRisk: RiskLevel;
  score: number;
  flaggedClauses: FlaggedClause[];
  analyzedAt: string;
}

export interface MetadataExtraction {
  id: string;
  field: string;
  value: string | number | boolean;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIDraftRequest {
  prompt: string;
  context?: string;
}

export interface AIDraftResponse {
  draft: string;
}
