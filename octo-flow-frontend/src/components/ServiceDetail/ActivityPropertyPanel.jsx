import { useState } from 'react';
import { X, Trash2, Circle, Square, Diamond, XCircle } from 'lucide-react';

const ActivityPropertyPanel = ({ node, edge, onUpdateNode, onUpdateEdge, onDeleteNode, onDeleteEdge, onClose }) => {
  // Node editing
  const [localNodeData, setLocalNodeData] = useState(node?.data || {});

  // Edge editing
  const [localEdgeLabel, setLocalEdgeLabel] = useState(edge?.label || '');
  const [localEdgeDescription, setLocalEdgeDescription] = useState(edge?.description || '');

  const handleNodeDataChange = (field, value) => {
    setLocalNodeData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveNode = () => {
    onUpdateNode(node.id, localNodeData);
  };

  const handleSaveEdge = () => {
    onUpdateEdge(edge.id, { label: localEdgeLabel, description: localEdgeDescription });
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'activity-start':
        return <Circle className="w-5 h-5" />;
      case 'activity-action':
        return <Square className="w-5 h-5" />;
      case 'activity-decision':
        return <Diamond className="w-5 h-5" />;
      case 'activity-end':
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getNodeTypeName = (type) => {
    switch (type) {
      case 'activity-start':
        return 'Start Node';
      case 'activity-action':
        return 'Action Node';
      case 'activity-decision':
        return 'Decision Node';
      case 'activity-end':
        return 'End Node';
      default:
        return 'Node';
    }
  };

  if (edge) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="bg-purple-500 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold">Connection Properties</h3>
          <button onClick={onClose} className="hover:bg-purple-600 rounded p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={localEdgeLabel}
              onChange={(e) => setLocalEdgeLabel(e.target.value)}
              onBlur={handleSaveEdge}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Connection label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={localEdgeDescription}
              onChange={(e) => setLocalEdgeDescription(e.target.value)}
              onBlur={handleSaveEdge}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe this connection..."
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onDeleteEdge(edge.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (node) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="bg-purple-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getNodeIcon(node.type)}
            <h3 className="font-bold">{getNodeTypeName(node.type)}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-purple-600 rounded p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Label field for all node types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={localNodeData.label || ''}
              onChange={(e) => handleNodeDataChange('label', e.target.value)}
              onBlur={handleSaveNode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Node label"
            />
          </div>

          {/* Description field for Action and Decision nodes */}
          {(node.type === 'activity-action' || node.type === 'activity-decision') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={localNodeData.description || ''}
                onChange={(e) => handleNodeDataChange('description', e.target.value)}
                onBlur={handleSaveNode}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe this node..."
              />
            </div>
          )}

          {/* Decision conditions for Decision nodes */}
          {node.type === 'activity-decision' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <input
                  type="text"
                  value={localNodeData.condition || ''}
                  onChange={(e) => handleNodeDataChange('condition', e.target.value)}
                  onBlur={handleSaveNode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., status === 'active'"
                />
              </div>
            </>
          )}

          {/* Action type for Action nodes */}
          {node.type === 'activity-action' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={localNodeData.actionType || 'process'}
                onChange={(e) => handleNodeDataChange('actionType', e.target.value)}
                onBlur={handleSaveNode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="process">Process</option>
                <option value="api-call">API Call</option>
                <option value="database">Database Operation</option>
                <option value="validation">Validation</option>
                <option value="notification">Notification</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onDeleteNode(node.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Node
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ActivityPropertyPanel;