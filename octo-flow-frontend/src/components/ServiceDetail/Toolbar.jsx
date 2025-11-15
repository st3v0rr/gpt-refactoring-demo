import { Database, Globe, Layout, Activity } from 'lucide-react';
import useProjectStore from '../../store/projectStore';

const Toolbar = ({ serviceId }) => {
  const { addNode, saveToLocalStorage } = useProjectStore();

  const handleAddNode = (type, defaultData) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100
    };
    addNode(serviceId, type, position, defaultData);
    saveToLocalStorage();
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleAddNode('entity', { name: 'New Entity', fields: [] })}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          <Database className="w-4 h-4" />
          Add Entity
        </button>

        <button
          onClick={() => handleAddNode('api-endpoint', {
            method: 'GET',
            path: '/api/endpoint',
            summary: '',
            requestFields: [],
            responseFields: []
          })}
          className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        >
          <Globe className="w-4 h-4" />
          Add API Endpoint
        </button>

        <button
          onClick={() => handleAddNode('ui-component', { name: 'New Component', componentType: 'component' })}
          className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
        >
          <Layout className="w-4 h-4" />
          Add UI Component
        </button>

        <div className="h-8 w-px bg-gray-300 mx-1" />

        <button
          onClick={() => handleAddNode('activity-container', {
            name: 'New Activity',
            description: '',
            activityNodes: [],
            activityEdges: []
          })}
          className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
        >
          <Activity className="w-4 h-4" />
          Add Activity Diagram
        </button>
      </div>
    </div>
  );
};

export default Toolbar;