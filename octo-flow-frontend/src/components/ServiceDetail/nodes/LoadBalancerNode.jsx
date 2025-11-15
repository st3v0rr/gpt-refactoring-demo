import { Network } from 'lucide-react';
import { Handle, Position } from 'reactflow';

const LoadBalancerNode = ({ data }) => {
  return (
    <div className="bg-white border-2 border-emerald-500 rounded-lg shadow-lg min-w-[180px]">
      <Handle type="target" position={Position.Top} />

      <div className="bg-emerald-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Network className="w-5 h-5" />
        <span className="font-bold">{data.name || 'Load Balancer'}</span>
      </div>

      <div className="p-3 bg-white space-y-2">
        {data.type && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Type:</span>
            <span className="ml-2 text-gray-800">{data.type}</span>
          </div>
        )}

        {data.algorithm && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Algorithm:</span>
            <span className="ml-2 text-gray-800">{data.algorithm}</span>
          </div>
        )}

        {data.healthCheck && (
          <div className="text-xs">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Health Check
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default LoadBalancerNode;