import { Zap } from 'lucide-react';
import { Handle, Position } from 'reactflow';

const CacheNode = ({ data }) => {
  return (
    <div className="bg-white border-2 border-rose-500 rounded-lg shadow-lg min-w-[180px]">
      <Handle type="target" position={Position.Top} />

      <div className="bg-rose-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Zap className="w-5 h-5" />
        <span className="font-bold">{data.name || 'Cache'}</span>
      </div>

      <div className="p-3 bg-white space-y-2">
        {data.engine && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Engine:</span>
            <span className="ml-2 text-gray-800">{data.engine}</span>
          </div>
        )}

        {data.ttl && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">TTL:</span>
            <span className="ml-2 text-gray-800">{data.ttl}</span>
          </div>
        )}

        {data.evictionPolicy && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Eviction:</span>
            <span className="ml-2 text-gray-800">{data.evictionPolicy}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default CacheNode;