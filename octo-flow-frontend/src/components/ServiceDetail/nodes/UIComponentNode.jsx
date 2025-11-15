import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Layout, Square, FileText, Maximize } from 'lucide-react';

const componentIcons = {
  page: Layout,
  component: Square,
  form: FileText,
  modal: Maximize
};

const UIComponentNode = memo(({ data, selected }) => {
  const Icon = componentIcons[data.componentType] || Layout;

  return (
    <div className={`bg-white border-2 ${selected ? 'border-orange-500' : 'border-orange-300'} rounded-lg shadow-lg min-w-[180px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="font-bold">UI Component</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="font-semibold text-gray-800">{data.name || 'Component'}</div>
        <div className="text-xs text-gray-500 mt-1 capitalize">{data.componentType || 'component'}</div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

UIComponentNode.displayName = 'UIComponentNode';

export default UIComponentNode;