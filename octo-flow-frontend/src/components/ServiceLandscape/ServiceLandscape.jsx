import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Download, Upload, Trash2 } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import ServiceNode from './ServiceNode';

const nodeTypes = {
  service: ServiceNode
};

const ServiceLandscape = () => {
  const navigate = useNavigate();
  const {
    project,
    addService,
    updateService,
    saveToLocalStorage,
    exportProject,
    clearAll,
    addServiceConnection,
    updateServiceConnection,
    deleteServiceConnection
  } = useProjectStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Convert services to ReactFlow nodes
  useEffect(() => {
    const flowNodes = project.services.map(service => ({
      id: service.id,
      type: 'service',
      position: service.position,
      data: {
        name: service.name,
        description: service.description,
        color: 'bg-blue-500'
      }
    }));
    setNodes(flowNodes);

    // Convert service connections to edges
    const flowEdges = (project.serviceConnections || []).map(conn => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      label: conn.label || conn.type || '',
      type: conn.edgeType || 'default',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: {
        strokeWidth: 2,
        stroke: getConnectionColor(conn.type)
      },
      data: {
        type: conn.type,
        protocol: conn.protocol,
        description: conn.description
      }
    }));
    setEdges(flowEdges);
  }, [project.services, project.serviceConnections, setNodes, setEdges]);

  const getConnectionColor = (type) => {
    const colors = {
      'http': '#10b981',      // green
      'grpc': '#3b82f6',      // blue
      'message-queue': '#f59e0b', // orange
      'database': '#8b5cf6',  // purple
      'event': '#ec4899',     // pink
      'sync': '#06b6d4',      // cyan
      'async': '#f97316'      // orange-red
    };
    return colors[type] || '#6b7280'; // default gray
  };

  const onConnect = useCallback(
    (params) => {
      // Create new service connection
      addServiceConnection({
        source: params.source,
        target: params.target,
        type: 'http',
        protocol: 'HTTP/REST',
        label: 'HTTP',
        description: ''
      });
    },
    [addServiceConnection]
  );

  const onNodeClick = useCallback((event, node) => {
    navigate(`/service/${node.id}`);
  }, [navigate]);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    const connection = (project.serviceConnections || []).find(c => c.id === edge.id);
    if (connection) {
      setSelectedConnection(connection);
    }
  }, [project.serviceConnections]);

  const handleUpdateConnection = (updates) => {
    if (selectedConnection) {
      updateServiceConnection(selectedConnection.id, updates);
      setSelectedConnection({ ...selectedConnection, ...updates });
    }
  };

  const handleDeleteConnection = () => {
    if (selectedConnection) {
      deleteServiceConnection(selectedConnection.id);
      setSelectedConnection(null);
    }
  };

  const onNodeDragStop = useCallback((event, node) => {
    updateService(node.id, { position: node.position });
    saveToLocalStorage();
  }, [updateService, saveToLocalStorage]);

  const handleAddService = () => {
    if (newServiceName.trim()) {
      addService(newServiceName, newServiceDesc);
      saveToLocalStorage();
      setNewServiceName('');
      setNewServiceDesc('');
      setShowAddDialog(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          <p className="text-sm text-gray-500">Service Landscape View</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
          <button
            onClick={exportProject}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowClearDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Connection Editor Dialog */}
      {selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Edit Service Connection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Type
                </label>
                <select
                  value={selectedConnection.type}
                  onChange={(e) => handleUpdateConnection({ type: e.target.value, label: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="http">HTTP/REST</option>
                  <option value="grpc">gRPC</option>
                  <option value="message-queue">Message Queue</option>
                  <option value="database">Database</option>
                  <option value="event">Event-driven</option>
                  <option value="sync">Synchronous</option>
                  <option value="async">Asynchronous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protocol
                </label>
                <input
                  type="text"
                  value={selectedConnection.protocol || ''}
                  onChange={(e) => handleUpdateConnection({ protocol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., HTTP/REST, RabbitMQ, Kafka"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedConnection.description || ''}
                  onChange={(e) => handleUpdateConnection({ description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the communication pattern"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-between">
                <button
                  onClick={handleDeleteConnection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedConnection(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Add New Service</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., User Service"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewServiceName('');
                    setNewServiceDesc('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  disabled={!newServiceName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4 text-red-600">Clear All Data?</h2>
            <p className="text-gray-700 mb-6">
              This will delete all services, entities, APIs, and diagrams. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAll();
                  setShowClearDialog(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceLandscape;