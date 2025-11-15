import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Globe } from 'lucide-react';

const methodColors = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-orange-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-yellow-500'
};

const ApiEndpointNode = memo(({ data, selected }) => {
  const requestCount = data.requestFields?.length || 0;
  const responseCount = data.responseFields?.length || 0;

  return (
    <div className={`bg-white border-2 ${selected ? 'border-green-500' : 'border-green-300'} rounded-lg shadow-lg min-w-[220px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Header */}
      <div className="bg-green-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Globe className="w-5 h-5" />
        <span className="font-bold">API Endpoint</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 text-xs font-bold text-white rounded ${methodColors[data.method] || 'bg-gray-500'}`}>
            {data.method || 'GET'}
          </span>
          <span className="font-mono text-sm">{data.path || '/path'}</span>
        </div>
        {data.summary && (
          <p className="text-xs text-gray-600 mt-2">{data.summary}</p>
        )}

        {/* Field Info */}
        {(requestCount > 0 || responseCount > 0) && (
          <div className="mt-3 pt-2 border-t border-gray-200 flex gap-3 text-xs">
            {requestCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-green-600 font-semibold">→</span>
                <span className="text-gray-600">{requestCount} req</span>
              </div>
            )}
            {responseCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-blue-600 font-semibold">←</span>
                <span className="text-gray-600">{responseCount} res</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

ApiEndpointNode.displayName = 'ApiEndpointNode';

export default ApiEndpointNode;