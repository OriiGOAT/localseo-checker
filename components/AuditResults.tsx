'use client';

import ScoreCard from './ScoreCard';
import ActionItems from './ActionItems';

interface MetaTags {
  title?: string;
  description?: string;
  viewport?: string;
  canonicalUrl?: string;
  ogImage?: string;
  robots?: string;
}

interface Metadata {
  domain: string;
  auditedAt: string;
  metaTags: MetaTags;
  hasLocalBusinessSchema: boolean;
  mobileUsable: boolean;
}

interface AuditResult {
  score: number;
  performanceScore: number;
  accessibilityScore: number;
  metaTagsScore: number;
  schemaMarkupScore: number;
  issues: string[];
  strengths: string[];
  actionItems: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  metadata: Metadata;
}

interface AuditResultsProps {
  results: AuditResult;
  onNewAudit: () => void;
}

export default function AuditResults({ results, onNewAudit }: AuditResultsProps) {

  const downloadReport = () => {
    const htmlContent = generateHTMLReport(results);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-report-${results.metadata.domain}-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Audit-Ergebnisse</h2>
        <p className="text-purple-200">{results.metadata.domain}</p>
        <p className="text-sm text-purple-300 mt-1">
          {new Date(results.metadata.auditedAt).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <ScoreCard score={results.score} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-semibold mb-2">Performance</p>
            <p className="text-3xl font-bold text-blue-600">{results.performanceScore}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-semibold mb-2">Barrierefreiheit</p>
            <p className="text-3xl font-bold text-green-600">{results.accessibilityScore}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-semibold mb-2">Meta-Tags</p>
            <p className="text-3xl font-bold text-yellow-600">{results.metaTagsScore}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-semibold mb-2">Schema Markup</p>
            <p className="text-3xl font-bold text-purple-600">{results.schemaMarkupScore}</p>
          </div>
        </div>
      </div>

      {results.strengths.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-green-800 mb-4">✅ Stärken</h3>
          <ul className="space-y-2">
            {results.strengths.map((strength: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-green-700">
                <span className="text-green-600 font-bold mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.issues.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-red-800 mb-4">⚠️ Probleme</h3>
          <ul className="space-y-2">
            {results.issues.map((issue: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-red-700">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.actionItems.length > 0 && (
        <ActionItems actionItems={results.actionItems} />
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Meta-Informationen</h3>
        <div className="space-y-4">
          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">Domain</p>
            <p className="font-semibold text-gray-800">{results.metadata.domain}</p>
          </div>
          {results.metadata.metaTags.title && (
            <div className="border-b pb-3">
              <p className="text-sm text-gray-600">Meta-Titel</p>
              <p className="font-semibold text-gray-800 truncate">{results.metadata.metaTags.title}</p>
            </div>
          )}
          {results.metadata.metaTags.description && (
            <div className="border-b pb-3">
              <p className="text-sm text-gray-600">Meta-Beschreibung</p>
              <p className="font-semibold text-gray-800 text-sm">
                {results.metadata.metaTags.description}
              </p>
            </div>
          )}
          <div className="border-b pb-3">
            <p className="text-sm text-gray-600">LocalBusiness Schema</p>
            <p className="font-semibold text-gray-800">
              {results.metadata.hasLocalBusinessSchema ? '✅ Vorhanden' : '❌ Nicht vorhanden'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mobile-freundlich</p>
            <p className="font-semibold text-gray-800">
              {results.metadata.mobileUsable ? '✅ Ja' : '❌ Nein'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={downloadReport}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
        >
          📥 Report herunterladen
        </button>
        <button
          onClick={onNewAudit}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
        >
          🔄 Neue Audit
        </button>
      </div>
    </div>
  );
}

function generateHTMLReport(results: AuditResult): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LocalSEO Checker - Report für ${results.metadata.domain}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; background: #f5f5f5; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #9333ea; padding-bottom: 20px; }
    .header h1 { font-size: 32px; color: #9333ea; margin-bottom: 10px; }
    .header p { color: #666; font-size: 16px; }
    .score-card { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; }
    .score-card .score { font-size: 64px; font-weight: bold; }
    .score-card .label { font-size: 18px; opacity: 0.9; margin-top: 10px; }
    .scores-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
    .score-item { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #9333ea; }
    .score-item .value { font-size: 28px; font-weight: bold; color: #9333ea; }
    .score-item .label { color: #666; font-size: 14px; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section h2 { font-size: 22px; color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #9333ea; }
    .list { list-style: none; }
    .list li { padding: 10px 0; padding-left: 25px; position: relative; }
    .list li:before { content: "✓"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
    .issues li:before { content: "✕"; color: #ef4444; }
    .action-item { background: #f9fafb; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .action-item .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
    .priority.high { background: #fee2e2; color: #991b1b; }
    .priority.medium { background: #fef3c7; color: #92400e; }
    .priority.low { background: #dbeafe; color: #0c2340; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
    @media (max-width: 768px) {
      .container { padding: 20px; }
      .scores-grid { grid-template-columns: 1fr; }
      .header h1 { font-size: 24px; }
      .score-card .score { font-size: 48px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LocalSEO Checker</h1>
      <p>Audit Report für ${results.metadata.domain}</p>
      <p style="font-size: 14px; margin-top: 10px;">${new Date(results.metadata.auditedAt).toLocaleDateString('de-DE')}</p>
    </div>

    <div class="score-card">
      <div class="score">${results.score}/100</div>
      <div class="label">Gesamt-Score</div>
    </div>

    <div class="scores-grid">
      <div class="score-item">
        <div class="value">${results.performanceScore}</div>
        <div class="label">Performance</div>
      </div>
      <div class="score-item">
        <div class="value">${results.accessibilityScore}</div>
        <div class="label">Barrierefreiheit</div>
      </div>
      <div class="score-item">
        <div class="value">${results.metaTagsScore}</div>
        <div class="label">Meta-Tags</div>
      </div>
      <div class="score-item">
        <div class="value">${results.schemaMarkupScore}</div>
        <div class="label">Schema Markup</div>
      </div>
    </div>

    ${
      results.strengths.length > 0
        ? `
    <div class="section">
      <h2>✅ Stärken</h2>
      <ul class="list">
        ${results.strengths.map((s: string) => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    `
        : ''
    }

    ${
      results.issues.length > 0
        ? `
    <div class="section">
      <h2>⚠️ Probleme</h2>
      <ul class="list issues">
        ${results.issues.map((i: string) => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    `
        : ''
    }

    ${
      results.actionItems.length > 0
        ? `
    <div class="section">
      <h2>🎯 Maßnahmen</h2>
      ${results.actionItems
        .map(
          (item) => `
        <div class="action-item">
          <div class="priority ${item.priority}">${item.priority.toUpperCase()}</div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <div class="section">
      <h2>📋 Website-Informationen</h2>
      <ul class="list" style="list-style: none; padding: 0;">
        <li><strong>Domain:</strong> ${results.metadata.domain}</li>
        <li><strong>LocalBusiness Schema:</strong> ${results.metadata.hasLocalBusinessSchema ? '✅ Vorhanden' : '❌ Nicht vorhanden'}</li>
        <li><strong>Mobile-freundlich:</strong> ${results.metadata.mobileUsable ? '✅ Ja' : '❌ Nein'}</li>
      </ul>
    </div>

    <div class="footer">
      <p>Dieser Report wurde mit LocalSEO Checker erstellt.</p>
      <p>© ${new Date().getFullYear()} LocalSEO Checker</p>
    </div>
  </div>
</body>
</html>
  `;
}
