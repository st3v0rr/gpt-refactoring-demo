import { Activity } from 'lucide-react';
import { Handle, Position } from 'reactflow';

const ActivityContainerNode = ({ data }) => {
  const nodeCount = data.activityNodes?.length || 0;

  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg shadow-lg min-w-[180px]">
      <Handle type="target" position={Position.Top} />

      <div className="bg-purple-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Activity className="w-5 h-5" />
        <span className="font-bold">{data.name || 'Activity'}</span>
      </div>

      <div className="p-3 bg-white">
        {data.description && (
          <p className="text-xs text-gray-600 mb-2">{data.description}</p>
        )}
        <div className="text-xs text-gray-500">
          {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
        </div>
        <div className="mt-2 text-xs text-purple-600 font-medium">
          Click to edit diagram →
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default ActivityContainerNode;