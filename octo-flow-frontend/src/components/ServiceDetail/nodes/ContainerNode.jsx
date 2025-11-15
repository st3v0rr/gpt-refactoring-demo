import { Box } from 'lucide-react';
import { Handle, Position } from 'reactflow';

const ContainerNode = ({ data }) => {
  return (
    <div className="bg-white border-2 border-cyan-500 rounded-lg shadow-lg min-w-[200px]">
      <Handle type="target" position={Position.Top} />

      <div className="bg-cyan-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Box className="w-5 h-5" />
        <span className="font-bold">{data.name || 'Container'}</span>
      </div>

      <div className="p-3 bg-white space-y-2">
        {data.image && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Image:</span>
            <div className="text-gray-800 font-mono text-xs mt-1 bg-gray-50 px-2 py-1 rounded">
              {data.image}
            </div>
          </div>
        )}

        {data.ports && data.ports.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Ports:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.ports.map((port, idx) => (
                <span key={idx} className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-xs">
                  {port}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.environment && data.environment.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Env Vars:</span>
            <div className="text-gray-600 mt-1">
              {data.environment.length} variable(s)
            </div>
          </div>
        )}

        {data.replicas && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Replicas:</span>
            <span className="ml-2 text-gray-800">{data.replicas}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default ContainerNode;