import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Circle, Square, Diamond, XCircle } from 'lucide-react';

const handleStyle = {
  width: '12px',
  height: '12px',
  backgroundColor: '#8b5cf6',
  border: '2px solid white',
  borderRadius: '50%'
};

export const ActivityStartNode = memo(({ data, selected }) => {
  return (
    <div className={`bg-purple-500 border-2 ${selected ? 'border-purple-700' : 'border-purple-300'} rounded-full w-16 h-16 flex items-center justify-center shadow-lg`}>
      <Circle className="w-8 h-8 text-white fill-white" />
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle}
      />
    </div>
  );
});

export const ActivityEndNode = memo(({ data, selected }) => {
  return (
    <div className={`bg-purple-700 border-2 ${selected ? 'border-purple-900' : 'border-purple-500'} rounded-full w-16 h-16 flex items-center justify-center shadow-lg`}>
      <XCircle className="w-8 h-8 text-white" />
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle}
      />
    </div>
  );
});

export const ActivityActionNode = memo(({ data, selected }) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle}
      />
      <div className={`bg-purple-100 border-2 ${selected ? 'border-purple-500' : 'border-purple-300'} rounded-lg shadow-lg px-4 py-3 min-w-[150px]`}>
        <div className="flex items-center gap-2">
          <Square className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-gray-800">{data.label || 'Action'}</span>
        </div>
        {data.description && (
          <p className="text-xs text-gray-600 mt-1">{data.description}</p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle}
      />
    </div>
  );
});

export const ActivityDecisionNode = memo(({ data, selected }) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle}
      />
      <div className={`bg-purple-100 border-2 ${selected ? 'border-purple-500' : 'border-purple-300'} shadow-lg px-6 py-4 transform rotate-45 w-24 h-24 flex items-center justify-center`}>
        <div className="transform -rotate-45">
          <Diamond className="w-5 h-5 text-purple-600" />
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-gray-800 w-20 text-center pointer-events-none">
        <div className="bg-white px-1 py-0.5 rounded">{data.label || 'Decision'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle}
        id="bottom"
      />
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
        id="right"
      />
    </div>
  );
});

ActivityStartNode.displayName = 'ActivityStartNode';
ActivityEndNode.displayName = 'ActivityEndNode';
ActivityActionNode.displayName = 'ActivityActionNode';
ActivityDecisionNode.displayName = 'ActivityDecisionNode';