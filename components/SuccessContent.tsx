'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Danke für Ihren Kauf!</h1>
            <p className="text-gray-600">Zahlung erfolgreich verarbeitet</p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 text-left">
            <p className="text-green-800 font-semibold mb-2">📧 Report wird gesendet</p>
            <p className="text-green-700 text-sm">
              Ihr SEO-Audit Report wird in Kürze an Ihre E-Mail-Adresse gesendet. Bitte überprüfen Sie auch Ihren Spam-Ordner.
            </p>
          </div>

          {sessionId && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-gray-600 mb-2">Session ID:</p>
              <p className="text-xs font-mono text-gray-800 break-all">{sessionId}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-gray-600">
              Der Report enthält eine detaillierte Analyse Ihrer Website mit:
            </p>
            <ul className="text-left space-y-2 text-sm text-gray-700 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>SEO-Score (0-100)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Performance-Analyse</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Meta-Tags Überprüfung</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>LocalBusiness Schema Check</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Konkrete Verbesserungsmaßnahmen</span>
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 text-center"
          >
            Zur Startseite
          </Link>
        </div>

        <div className="mt-8 text-center text-purple-200">
          <p className="text-sm">Haben Sie Fragen? Kontaktieren Sie unseren Support.</p>
        </div>
      </div>
    </div>
  );
}
