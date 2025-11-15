import { Database } from 'lucide-react';
import { Handle, Position } from 'reactflow';

const DatabaseDeploymentNode = ({ data }) => {
  return (
    <div className="bg-white border-2 border-indigo-500 rounded-lg shadow-lg min-w-[180px]">
      <Handle type="target" position={Position.Top} />

      <div className="bg-indigo-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Database className="w-5 h-5" />
        <span className="font-bold">{data.name || 'Database'}</span>
      </div>

      <div className="p-3 bg-white space-y-2">
        {data.engine && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Engine:</span>
            <span className="ml-2 text-gray-800">{data.engine}</span>
          </div>
        )}

        {data.version && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Version:</span>
            <span className="ml-2 text-gray-800">{data.version}</span>
          </div>
        )}

        {data.storage && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Storage:</span>
            <span className="ml-2 text-gray-800">{data.storage}</span>
          </div>
        )}

        {data.backup && (
          <div className="text-xs">
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Backup Enabled
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default DatabaseDeploymentNode;