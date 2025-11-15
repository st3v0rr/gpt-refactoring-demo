import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Server } from 'lucide-react';

const ServiceNode = memo(({ data }) => {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded ${data.color || 'bg-blue-500'}`}>
            <Server className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{data.name}</h3>
          </div>
        </div>

        {data.description && (
          <p className="text-sm text-gray-600 mt-2">{data.description}</p>
        )}

        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          Click to view details
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

ServiceNode.displayName = 'ServiceNode';

export default ServiceNode;