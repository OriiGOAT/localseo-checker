'use client';

interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActionItemsProps {
  actionItems: ActionItem[];
}

export default function ActionItems({ actionItems }: ActionItemsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-l-4 border-red-500 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-l-4 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100 border-l-4 border-gray-500 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Hohe Priorität';
      case 'medium':
        return 'Mittlere Priorität';
      case 'low':
        return 'Niedrige Priorität';
      default:
        return 'Priorität';
    }
  };

  const sortedItems = [...actionItems].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] -
           priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">🎯 Empfohlene Maßnahmen</h3>
      <div className="space-y-4">
        {sortedItems.map((item, idx) => (
          <div key={idx} className={`${getPriorityColor(item.priority)} rounded-lg p-5 transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-lg">{item.title}</h4>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                item.priority === 'high' ? 'bg-red-500 text-white' :
                item.priority === 'medium' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {getPriorityLabel(item.priority)}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
