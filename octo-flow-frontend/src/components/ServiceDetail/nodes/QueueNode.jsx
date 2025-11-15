import { ListOrdered } from 'lucide-react';
import { Handle, Position } from 'reactflow';

const QueueNode = ({ data }) => {
  return (
    <div className="bg-white border-2 border-amber-500 rounded-lg shadow-lg min-w-[180px]">
      <Handle type="target" position={Position.Top} />

      <div className="bg-amber-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <ListOrdered className="w-5 h-5" />
        <span className="font-bold">{data.name || 'Queue'}</span>
      </div>

      <div className="p-3 bg-white space-y-2">
        {data.type && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Type:</span>
            <span className="ml-2 text-gray-800">{data.type}</span>
          </div>
        )}

        {data.maxSize && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Max Size:</span>
            <span className="ml-2 text-gray-800">{data.maxSize}</span>
          </div>
        )}

        {data.deadLetterQueue && (
          <div className="text-xs">
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">
              DLQ Enabled
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default QueueNode;