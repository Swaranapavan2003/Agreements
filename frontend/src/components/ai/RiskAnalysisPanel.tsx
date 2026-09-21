import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { RiskAnalysis, RiskLevel } from '../../types/ai.types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface RiskAnalysisPanelProps {
  agreementId: string;
}

export const RiskAnalysisPanel: React.FC<RiskAnalysisPanelProps> = ({ agreementId }) => {
  const { analyzeRisk, loading, error } = useAI();
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [agreementId]);

  const loadAnalysis = async () => {
    const result = await analyzeRisk(agreementId);
    if (result) {
      setAnalysis(result);
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'gray';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'High': return <ShieldAlert className="w-8 h-8 text-red-500" />;
      case 'Medium': return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'Low': return <Shield className="w-8 h-8 text-green-500" />;
      default: return <CheckCircle className="w-8 h-8 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p>Analyzing document risks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <p className="font-semibold">Error loading risk analysis</p>
        <p className="text-sm mt-1">{error}</p>
        <Button onClick={loadAnalysis} variant="outline" className="mt-4">Retry</Button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getRiskIcon(analysis.overallRisk)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Risk Score</h3>
            <p className="text-sm text-gray-500">Analyzed on {new Date(analysis.analyzedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-right mt-2">
          <div className="text-3xl font-bold text-gray-900">{analysis.score}/100</div>
          <Badge variant={getRiskColor(analysis.overallRisk)}>
            {analysis.overallRisk} Risk
          </Badge>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">Flagged Clauses ({analysis.flaggedClauses.length})</h4>
        {analysis.flaggedClauses.length === 0 ? (
          <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500 flex flex-col items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <p>No high or medium risk clauses detected.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.flaggedClauses.map((clause) => (
              <div key={clause.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={getRiskColor(clause.riskLevel)}>
                    {clause.riskLevel} Risk
                  </Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-4 border-l-4 border-gray-300">
                  "{clause.clauseText}"
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Issue</h5>
                    <p className="text-sm text-gray-800">{clause.explanation}</p>
                  </div>
                  {clause.suggestion && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Suggestion</h5>
                      <p className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100">
                        {clause.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
