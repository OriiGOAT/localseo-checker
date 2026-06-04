'use client';

import { useState } from 'react';
import AuditForm from '@/components/AuditForm';
import AuditResults from '@/components/AuditResults';

export default function Home() {
  const [auditResults, setAuditResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAudit = async (domain: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Audit fehlgeschlagen');
      }

      const results = await response.json();
      setAuditResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAudit = () => {
    setAuditResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">LocalSEO Checker</h1>
          <p className="text-xl text-purple-200">
            Überprüfen Sie Ihre Website auf lokale SEO-Optimierung
          </p>
        </header>

        {!auditResults ? (
          <AuditForm onAudit={handleAudit} loading={loading} error={error} />
        ) : (
          <AuditResults results={auditResults} onNewAudit={handleNewAudit} />
        )}
      </div>
    </div>
  );
}
