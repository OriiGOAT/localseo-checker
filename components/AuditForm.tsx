'use client';

import { useState } from 'react';

interface AuditFormProps {
  onAudit: (domain: string) => void;
  loading: boolean;
  error: string;
}

export default function AuditForm({ onAudit, loading, error }: AuditFormProps) {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleFreeAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      onAudit(domain);
      setDomain('');
    }
  };

  const handlePaidAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !email.trim()) return;

    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      const { checkoutUrl } = await response.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Audit Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 border-2 border-gray-200 hover:border-purple-300 transition-colors">
          <h3 className="text-xl font-bold text-gray-800 mb-2">🔍 Kostenlos</h3>
          <p className="text-sm text-gray-600 mb-6">Einfache SEO-Analyse</p>

          <form onSubmit={handleFreeAudit}>
            <div className="mb-6">
              <label htmlFor="domain-free" className="block text-sm font-semibold text-gray-800 mb-2">
                Website-Domain
              </label>
              <input
                type="text"
                id="domain-free"
                placeholder="beispiel.de"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !domain.trim()}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Wird durchgeführt...
                </span>
              ) : (
                'Kostenlos starten'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">Keine E-Mail erforderlich</p>
        </div>

        {/* Premium Audit Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-2xl p-8 border-2 border-purple-300 relative">
          <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
            BELIEBT
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2">📊 Premium</h3>
          <p className="text-sm text-gray-600 mb-2">Detaillierter Report + PDF</p>
          <p className="text-3xl font-bold text-purple-600 mb-6">€9,90</p>

          <form onSubmit={handlePaidAudit}>
            <div className="mb-4">
              <label htmlFor="domain-paid" className="block text-sm font-semibold text-gray-800 mb-2">
                Website-Domain
              </label>
              <input
                type="text"
                id="domain-paid"
                placeholder="beispiel.de"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={checkoutLoading}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                E-Mail-Adresse
              </label>
              <input
                type="email"
                id="email"
                placeholder="ihr@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={checkoutLoading}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-gray-900 placeholder-gray-500"
              />
              <p className="mt-2 text-xs text-gray-600">
                Report wird hierhin gesendet
              </p>
            </div>

            <button
              type="submit"
              disabled={checkoutLoading || !domain.trim() || !email.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Wird weitergeleitet...
                </span>
              ) : (
                'Jetzt kaufen – €9,90'
              )}
            </button>
          </form>

          <ul className="text-xs text-gray-600 mt-4 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-purple-600">✓</span>
              <span>Detaillierter Report</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">✓</span>
              <span>PDF zum Herunterladen</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">✓</span>
              <span>Per E-Mail gesendet</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-2">🚀 Performance</h3>
          <p className="text-gray-600 text-sm">
            Überprüfung der Ladegeschwindigkeit und Leistung Ihrer Website
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-2">📍 Local SEO</h3>
          <p className="text-gray-600 text-sm">
            Analyse von LocalBusiness Schema und Strukturierten Daten
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-2">🎯 Meta-Tags</h3>
          <p className="text-gray-600 text-sm">
            Validierung von Titel, Beschreibung und anderen Meta-Informationen
          </p>
        </div>
      </div>
    </div>
  );
}
