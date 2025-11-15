import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Database, Plus } from 'lucide-react';

const EntityNode = memo(({ data, selected }) => {
  return (
    <div className={`bg-white border-2 ${selected ? 'border-blue-500' : 'border-blue-300'} rounded-lg shadow-lg min-w-[250px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Database className="w-5 h-5" />
        <span className="font-bold">{data.name || 'Entity'}</span>
      </div>

      {/* Fields */}
      <div className="p-3">
        {data.fields && data.fields.length > 0 ? (
          <div className="space-y-1">
            {data.fields.map((field) => (
              <div
                key={field.id}
                className="text-sm py-1 px-2 hover:bg-gray-50 rounded flex items-center gap-2"
              >
                <span className="font-mono text-gray-700">{field.name}</span>
                <span className="text-xs text-gray-500">: {field.type}</span>
                {field.required && <span className="text-xs text-red-500">*</span>}
                {field.type === 'reference' && field.referenceEntity && (
                  <span className="text-xs text-blue-500">→ {field.referenceEntity}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-2">No fields</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

EntityNode.displayName = 'EntityNode';

export default EntityNode;