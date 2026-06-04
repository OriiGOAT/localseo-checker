'use client';

interface ScoreCardProps {
  score: number;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-600 to-emerald-600';
    if (score >= 75) return 'from-yellow-600 to-orange-600';
    if (score >= 50) return 'from-orange-600 to-red-600';
    return 'from-red-600 to-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Ausgezeichnet';
    if (score >= 75) return 'Gut';
    if (score >= 50) return 'Befriedigend';
    return 'Verbesserungsbedürftig';
  };

  return (
    <div className={`bg-gradient-to-br ${getScoreColor(score)} rounded-2xl shadow-2xl p-12 text-white text-center transform hover:scale-105 transition-transform duration-200`}>
      <div className="mb-4">
        <div className="text-6xl font-bold mb-2">{score}</div>
        <div className="text-3xl font-semibold opacity-90">/100</div>
      </div>
      <div className="text-xl font-semibold opacity-90 mb-2">{getScoreLabel(score)}</div>
      <div className="text-sm opacity-75">Gesamt-Score</div>
    </div>
  );
}
