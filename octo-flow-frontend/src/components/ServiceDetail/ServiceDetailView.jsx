import { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import { ArrowLeft, Database, Globe, Layout, Activity, Filter, Sparkles } from 'lucide-react';
import useProjectStore from '../../store/projectStore';
import EntityNode from './nodes/EntityNode';
import ApiEndpointNode from './nodes/ApiEndpointNode';
import UIComponentNode from './nodes/UIComponentNode';
import ActivityContainerNode from './nodes/ActivityContainerNode';
import { ActivityStartNode, ActivityEndNode, ActivityActionNode, ActivityDecisionNode } from './nodes/ActivityNodes';
import ContainerNode from './nodes/ContainerNode';
import DatabaseDeploymentNode from './nodes/DatabaseDeploymentNode';
import QueueNode from './nodes/QueueNode';
import LoadBalancerNode from './nodes/LoadBalancerNode';
import CacheNode from './nodes/CacheNode';
import PropertyPanel from './PropertyPanel';
import EdgePropertyPanel from './EdgePropertyPanel';
import Toolbar from './Toolbar';
import DeploymentToolbar from './DeploymentToolbar';
import ActivityEditorDialog from './ActivityEditorDialog';

const nodeTypes = {
  entity: EntityNode,
  'api-endpoint': ApiEndpointNode,
  'ui-component': UIComponentNode,
  'activity-container': ActivityContainerNode,
  'activity-start': ActivityStartNode,
  'activity-end': ActivityEndNode,
  'activity-action': ActivityActionNode,
  'activity-decision': ActivityDecisionNode,
  'deployment-container': ContainerNode,
  'deployment-database': DatabaseDeploymentNode,
  'deployment-queue': QueueNode,
  'deployment-loadbalancer': LoadBalancerNode,
  'deployment-cache': CacheNode
};

const edgeStyles = {
  relationship: { strokeWidth: 2, stroke: '#3b82f6' },
  uses: { strokeWidth: 2, stroke: '#10b981', strokeDasharray: '5,5' },
  calls: { strokeWidth: 2, stroke: '#f59e0b', strokeDasharray: '2,2' },
  displays: { strokeWidth: 1, stroke: '#6b7280' },
  flow: { strokeWidth: 2, stroke: '#8b5cf6' }
};

const elk = new ELK();

// ELK layout options - optimized for better spacing and no overlaps
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '150',
  'elk.spacing.nodeNode': '100',
  'elk.direction': 'DOWN',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.semiInteractive': 'true',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.unnecessaryBendpoints': 'true',
  'elk.layered.spacing.edgeNodeBetweenLayers': '50',
  'elk.spacing.componentComponent': '100',
  'elk.separateConnectedComponents': 'true',
};

const ServiceDetailViewInner = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const updateNode = useProjectStore(state => state.updateNode);
  const deleteNode = useProjectStore(state => state.deleteNode);
  const addEdgeToStore = useProjectStore(state => state.addEdge);
  const updateEdges = useProjectStore(state => state.updateEdges);
  const saveToLocalStorage = useProjectStore(state => state.saveToLocalStorage);
  const service = useProjectStore(state =>
    state.project.services.find(s => s.id === serviceId)
  );
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [filters, setFilters] = useState({
    entity: true,
    'api-endpoint': true,
    'ui-component': true,
    'activity-container': true,
    'activity-start': true,
    'activity-end': true,
    'activity-action': true,
    'activity-decision': true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activityEditorOpen, setActivityEditorOpen] = useState(false);
  const [editingActivityNode, setEditingActivityNode] = useState(null);
  const [activeTab, setActiveTab] = useState('application'); // 'application' or 'deployment'

  useEffect(() => {
    if (service && !activityEditorOpen) {
      // Only update nodes/edges when activity editor is closed
      // Filter nodes based on activeTab
      let filteredNodes;
      if (activeTab === 'application') {
        // Show application nodes only
        filteredNodes = service.nodes.filter(node =>
          !node.type.startsWith('deployment-') && filters[node.type]
        );
      } else {
        // Show deployment nodes only
        filteredNodes = service.nodes.filter(node =>
          node.type.startsWith('deployment-')
        );
      }

      setNodes(filteredNodes);
      setEdges(service.edges.map(edge => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed },
        ...(edgeStyles[edge.type] || {})
      })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, filters, activeTab, activityEditorOpen]);

  const onConnect = useCallback((params) => {
    // Determine edge type based on source and target node types
    const sourceNode = service.nodes.find(n => n.id === params.source);
    const targetNode = service.nodes.find(n => n.id === params.target);

    let edgeType = 'default';
    let edgeStyle = {};
    let label = '';

    if (sourceNode && targetNode) {
      // Entity to Entity = Relationship
      if (sourceNode.type === 'entity' && targetNode.type === 'entity') {
        edgeType = 'relationship';
        edgeStyle = edgeStyles.relationship;
        label = '1:n';
      }
      // API to Entity = uses
      else if (sourceNode.type === 'api-endpoint' && targetNode.type === 'entity') {
        edgeType = 'uses';
        edgeStyle = edgeStyles.uses;
        label = 'uses';
      }
      // UI to API = calls
      else if (sourceNode.type === 'ui-component' && targetNode.type === 'api-endpoint') {
        edgeType = 'calls';
        edgeStyle = edgeStyles.calls;
        label = 'calls';
      }
      // UI to Entity = displays
      else if (sourceNode.type === 'ui-component' && targetNode.type === 'entity') {
        edgeType = 'displays';
        edgeStyle = edgeStyles.displays;
        label = 'displays';
      }
      // Activity to Activity = flow
      else if (sourceNode.type.startsWith('activity-') && targetNode.type.startsWith('activity-')) {
        edgeType = 'flow';
        edgeStyle = edgeStyles.flow;
      }
      // API to Activity Container = triggers
      else if (sourceNode.type === 'api-endpoint' && targetNode.type === 'activity-container') {
        edgeType = 'triggers';
        edgeStyle = { strokeWidth: 2, stroke: '#ec4899', strokeDasharray: '3,3' };
        label = 'triggers';
      }
      // Activity Container to API = calls
      else if (sourceNode.type === 'activity-container' && targetNode.type === 'api-endpoint') {
        edgeType = 'calls';
        edgeStyle = edgeStyles.calls;
        label = 'calls API';
      }
      // Activity Action to Entity = reads/writes
      else if (sourceNode.type === 'activity-action' && targetNode.type === 'entity') {
        edgeType = 'data-access';
        edgeStyle = { strokeWidth: 2, stroke: '#06b6d4' };
        label = 'data access';
      }
    }

    const newEdge = {
      ...params,
      type: edgeType,
      label: label,
      markerEnd: { type: MarkerType.ArrowClosed },
      ...edgeStyle
    };
    setEdges((eds) => addEdge(newEdge, eds));
    addEdgeToStore(serviceId, newEdge);
    saveToLocalStorage();
  }, [setEdges, addEdgeToStore, serviceId, saveToLocalStorage, service]);

  const onNodeClick = useCallback((event, node) => {
    // Open activity editor for activity-container nodes (double-click or without Shift key)
    // Hold Shift to open PropertyPanel instead
    if (node.type === 'activity-container') {
      if (event.shiftKey) {
        // Shift+Click opens PropertyPanel for editing name/description or deleting
        setSelectedNode(node);
        setSelectedEdge(null);
      } else {
        // Normal click opens activity editor
        setEditingActivityNode(node);
        setActivityEditorOpen(true);
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    } else {
      setSelectedNode(node);
      setSelectedEdge(null);
    }
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onNodeDragStop = useCallback((event, node) => {
    updateNode(serviceId, node.id, { position: node.position });
    saveToLocalStorage();
  }, [serviceId, updateNode, saveToLocalStorage]);

  const onNodesChangeHandler = useCallback((changes) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const onEdgesChangeHandler = useCallback((changes) => {
    onEdgesChange(changes);

    // Update edges in store when removed
    const removeChanges = changes.filter(c => c.type === 'remove');
    if (removeChanges.length > 0 && service) {
      const updatedEdges = service.edges.filter(e => !removeChanges.find(c => c.id === e.id));
      updateEdges(serviceId, updatedEdges);
      saveToLocalStorage();
    }
  }, [onEdgesChange, service, serviceId, updateEdges, saveToLocalStorage]);

  const handleNodeUpdate = useCallback((nodeId, data) => {
    updateNode(serviceId, nodeId, { data });
    saveToLocalStorage();

    // Update local state
    setNodes(nds => nds.map(node =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
  }, [serviceId, updateNode, saveToLocalStorage, setNodes]);

  const handleNodeDelete = useCallback((nodeId) => {
    deleteNode(serviceId, nodeId);
    saveToLocalStorage();
    setSelectedNode(null);
  }, [serviceId, deleteNode, saveToLocalStorage]);

  const handleEdgeUpdate = useCallback((edgeId, updates) => {
    const updatedEdges = service.edges.map(e =>
      e.id === edgeId ? { ...e, ...updates } : e
    );
    updateEdges(serviceId, updatedEdges);
    saveToLocalStorage();

    // Update local state
    setEdges(eds => eds.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    ));
  }, [service, serviceId, updateEdges, saveToLocalStorage, setEdges]);

  const handleEdgeDelete = useCallback((edgeId) => {
    const updatedEdges = service.edges.filter(e => e.id !== edgeId);
    updateEdges(serviceId, updatedEdges);
    saveToLocalStorage();
    setSelectedEdge(null);
  }, [service, serviceId, updateEdges, saveToLocalStorage]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input field
      const target = e.target;
      const isInputField = target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.isContentEditable;

      if (isInputField) {
        return; // Don't handle shortcuts when typing in input fields
      }

      // Delete selected node or edge (Delete or Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedNode) {
          e.preventDefault();
          handleNodeDelete(selectedNode.id);
        } else if (selectedEdge) {
          e.preventDefault();
          handleEdgeDelete(selectedEdge.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, handleNodeDelete, handleEdgeDelete]);

  const toggleFilter = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Get node dimensions based on type
  const getNodeDimensions = (node) => {
    // More accurate dimensions for different node types
    const dimensions = {
      'entity': { width: 220, height: 180 },
      'api-endpoint': { width: 240, height: 160 },
      'ui-component': { width: 200, height: 140 },
      'activity-container': { width: 200, height: 140 },
      'activity-start': { width: 120, height: 120 },
      'activity-end': { width: 120, height: 120 },
      'activity-action': { width: 180, height: 100 },
      'activity-decision': { width: 140, height: 140 },
      'deployment-container': { width: 240, height: 200 },
      'deployment-database': { width: 200, height: 160 },
      'deployment-queue': { width: 200, height: 160 },
      'deployment-loadbalancer': { width: 200, height: 160 },
      'deployment-cache': { width: 200, height: 160 },
    };
    return dimensions[node.type] || { width: 200, height: 150 };
  };

  // Auto-layout with ELK
  const handleAutoLayout = useCallback(async () => {
    // Get all node IDs currently visible
    const nodeIds = new Set(nodes.map(n => n.id));

    // Filter edges to only include those connecting visible nodes
    const visibleEdges = edges.filter(edge =>
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    const graph = {
      id: 'root',
      layoutOptions: elkOptions,
      children: nodes.map((node) => {
        const dims = getNodeDimensions(node);
        return {
          id: node.id,
          width: dims.width,
          height: dims.height,
        };
      }),
      edges: visibleEdges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    try {
      const layoutedGraph = await elk.layout(graph);

      const layoutedNodes = nodes.map((node) => {
        const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
        return {
          ...node,
          position: {
            x: layoutedNode?.x ?? node.position.x,
            y: layoutedNode?.y ?? node.position.y,
          },
        };
      });

      setNodes(layoutedNodes);

      // Update positions in store
      layoutedNodes.forEach((node) => {
        updateNode(serviceId, node.id, { position: node.position });
      });
      saveToLocalStorage();

      // Fit view after layout
      window.requestAnimationFrame(() => {
        fitView({ padding: 0.2, duration: 300 });
      });
    } catch (error) {
      console.error('Error during auto-layout:', error);
    }
  }, [nodes, edges, setNodes, updateNode, serviceId, saveToLocalStorage, fitView]);

  if (!service) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Service not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Landscape
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Landscape
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{service.name}</h1>
            <p className="text-xs text-gray-500">Service Detail View</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoLayout}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Auto Layout
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('application')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'application'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Application Structure
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'deployment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deployment Architecture
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && activeTab === 'application' && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.entity}
                onChange={() => toggleFilter('entity')}
                className="rounded"
              />
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Entities</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters['api-endpoint']}
                onChange={() => toggleFilter('api-endpoint')}
                className="rounded"
              />
              <Globe className="w-4 h-4 text-green-500" />
              <span className="text-sm">API Endpoints</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters['ui-component']}
                onChange={() => toggleFilter('ui-component')}
                className="rounded"
              />
              <Layout className="w-4 h-4 text-orange-500" />
              <span className="text-sm">UI Components</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters['activity-start'] && filters['activity-action']}
                onChange={() => {
                  const newValue = !filters['activity-action'];
                  setFilters(prev => ({
                    ...prev,
                    'activity-start': newValue,
                    'activity-end': newValue,
                    'activity-action': newValue,
                    'activity-decision': newValue
                  }));
                }}
                className="rounded"
              />
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-sm">Activity Nodes</span>
            </label>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {activeTab === 'application' && <Toolbar serviceId={serviceId} />}
      {activeTab === 'deployment' && <DeploymentToolbar serviceId={serviceId} />}

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Property Panel */}
        {selectedNode && (
          <PropertyPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {/* Edge Property Panel */}
        {selectedEdge && (
          <EdgePropertyPanel
            edge={selectedEdge}
            onUpdate={handleEdgeUpdate}
            onDelete={handleEdgeDelete}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </div>

      {/* Activity Editor Dialog */}
      {editingActivityNode && (
        <ActivityEditorDialog
          isOpen={activityEditorOpen}
          onClose={() => {
            setActivityEditorOpen(false);
            setEditingActivityNode(null);
          }}
          activityData={editingActivityNode.data}
          onSave={(updatedData) => {
            handleNodeUpdate(editingActivityNode.id, updatedData);
          }}
        />
      )}
    </div>
  );
};

const ServiceDetailView = () => {
  return (
    <ReactFlowProvider>
      <ServiceDetailViewInner />
    </ReactFlowProvider>
  );
};

export default ServiceDetailView;