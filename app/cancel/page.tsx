'use client';

import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-4xl">✕</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Kauf abgebrochen</h1>
            <p className="text-gray-600">Der Zahlungsvorgang wurde unterbrochen</p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 text-left">
            <p className="text-red-800 font-semibold mb-2">❌ Keine Gebühren erhoben</p>
            <p className="text-red-700 text-sm">
              Ihrem Konto wurde kein Geld belastet. Sie können jederzeit einen neuen Audit durchführen.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-gray-600">Mögliche Gründe für den Abbruch:</p>
            <ul className="text-left space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span>Zahlungsmethode wurde abgelehnt</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span>Checkout-Session ist abgelaufen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span>Sie haben den Kauf abgebrochen</span>
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 text-center mb-3"
          >
            Zurück zur Startseite
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all duration-200 text-center"
          >
            Neuen Audit starten
          </Link>
        </div>

        <div className="mt-8 text-center text-purple-200">
          <p className="text-sm">Probleme? Kontaktieren Sie unseren Support.</p>
        </div>
      </div>
    </div>
  );
}
