import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

const EdgePropertyPanel = ({ edge, onUpdate, onDelete, onClose }) => {
  const [localLabel, setLocalLabel] = useState(edge.label || '');
  const [localDescription, setLocalDescription] = useState(edge.description || '');

  useEffect(() => {
    setLocalLabel(edge.label || '');
    setLocalDescription(edge.description || '');
  }, [edge]);

  const handleSave = () => {
    onUpdate(edge.id, {
      label: localLabel,
      description: localDescription
    });
  };

  const getEdgeTypeName = (type) => {
    const types = {
      relationship: 'Relationship',
      uses: 'Uses',
      calls: 'Calls',
      displays: 'Displays',
      flow: 'Flow',
      default: 'Connection'
    };
    return types[type] || 'Connection';
  };

  const getEdgeTypeColor = (type) => {
    const colors = {
      relationship: 'bg-blue-100 text-blue-800',
      uses: 'bg-green-100 text-green-800',
      calls: 'bg-orange-100 text-orange-800',
      displays: 'bg-gray-100 text-gray-800',
      flow: 'bg-purple-100 text-purple-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Connection Properties</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className={`mb-4 px-3 py-2 rounded-lg ${getEdgeTypeColor(edge.type)}`}>
          <div className="text-xs font-medium uppercase opacity-75">Connection Type</div>
          <div className="font-semibold">{getEdgeTypeName(edge.type)}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1:n, 1:1, n:m"
            />
            <p className="text-xs text-gray-500 mt-1">
              {edge.type === 'relationship' && 'Relationship cardinality (1:1, 1:n, n:m)'}
              {edge.type === 'uses' && 'Describes how the API uses the entity'}
              {edge.type === 'calls' && 'Describes the API call'}
              {edge.type === 'displays' && 'Describes what is displayed'}
              {edge.type === 'flow' && 'Flow condition or label'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Add a detailed description of this connection..."
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div><span className="font-medium">Source:</span> {edge.source}</div>
              <div><span className="font-medium">Target:</span> {edge.target}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => onDelete(edge.id)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EdgePropertyPanel;