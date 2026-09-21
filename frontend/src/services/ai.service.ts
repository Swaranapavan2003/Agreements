import { RiskAnalysis, MetadataExtraction, ChatMessage, AIDraftRequest, AIDraftResponse } from '../types/ai.types';

// Mock data and API calls for now
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const aiService = {
  async analyzeRisk(agreementId: string): Promise<RiskAnalysis> {
    await delay(1500);
    return {
      overallRisk: 'Medium',
      score: 65,
      analyzedAt: new Date().toISOString(),
      flaggedClauses: [
        {
          id: '1',
          clauseText: 'This agreement shall automatically renew for successive one-year terms unless either party provides written notice of termination at least 90 days prior to the end of the then-current term.',
          riskLevel: 'Medium',
          explanation: 'Auto-renewal clauses can lead to unintended continuation of services and unexpected costs.',
          suggestion: 'Consider negotiating a mutual option to renew instead of automatic renewal.'
        },
        {
          id: '2',
          clauseText: 'Provider\'s total liability arising out of or related to this agreement shall not exceed the total amount paid by Customer in the one (1) month preceding the event giving rise to the claim.',
          riskLevel: 'High',
          explanation: 'The limitation of liability is severely capped to one month\'s fees, which may not cover potential damages.',
          suggestion: 'Request a higher liability cap, such as 12 months of fees or a specific dollar amount.'
        }
      ]
    };
  },

  async extractMetadata(file: File): Promise<MetadataExtraction[]> {
    await delay(2000);
    return [
      { id: '1', field: 'Effective Date', value: '2023-11-01', confidence: 0.95 },
      { id: '2', field: 'Party A', value: 'Acme Corp', confidence: 0.98 },
      { id: '3', field: 'Party B', value: 'Globex Inc', confidence: 0.97 },
      { id: '4', field: 'Governing Law', value: 'California', confidence: 0.85 },
    ];
  },

  async askQuestion(agreementId: string, message: string): Promise<ChatMessage> {
    await delay(1000);
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `This is a simulated AI response to: "${message}". In a real implementation, this would call an LLM backend.`,
      timestamp: new Date().toISOString()
    };
  },

  async magicDraft(request: AIDraftRequest): Promise<AIDraftResponse> {
    await delay(1500);
    return {
      draft: `[AI Drafted Clause based on: "${request.prompt}"]\n\nIn the event of a breach of this Agreement by either Party, the non-breaching Party shall provide written notice of such breach to the breaching Party. The breaching Party shall have thirty (30) days from the receipt of such notice to cure the breach.`
    };
  }
};
