import { useState, useCallback, useEffect } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
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
import { ActivityStartNode, ActivityEndNode, ActivityActionNode, ActivityDecisionNode } from './nodes/ActivityNodes';
import ActivityPropertyPanel from './ActivityPropertyPanel';

const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
  'elk.direction': 'DOWN',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.spacing.edgeNodeBetweenLayers': '40',
};

const nodeTypes = {
  'activity-start': ActivityStartNode,
  'activity-end': ActivityEndNode,
  'activity-action': ActivityActionNode,
  'activity-decision': ActivityDecisionNode
};

const ActivityEditorDialogInner = ({ isOpen, onClose, activityData, onSave }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(activityData.activityNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activityData.activityEdges || []);
  const [activityName, setActivityName] = useState(activityData.name || 'Activity');
  const [activityDescription, setActivityDescription] = useState(activityData.description || '');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (isOpen) {
      setNodes(activityData.activityNodes || []);
      setEdges(activityData.activityEdges || []);
      setActivityName(activityData.name || 'Activity');
      setActivityDescription(activityData.description || '');
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [isOpen, activityData, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleNodeUpdate = useCallback((nodeId, data) => {
    setNodes((nds) => nds.map(node =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
  }, [setNodes]);

  const handleNodeDelete = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const handleEdgeUpdate = useCallback((edgeId, updates) => {
    setEdges((eds) => eds.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    ));
  }, [setEdges]);

  const handleEdgeDelete = useCallback((edgeId) => {
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
    setSelectedEdge(null);
  }, [setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
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
  }, [isOpen, selectedNode, selectedEdge, handleNodeDelete, handleEdgeDelete]);

  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2, stroke: '#8b5cf6' }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddNode = (type, defaultData) => {
    const newNode = {
      id: generateId(),
      type: type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      },
      data: defaultData
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveAndClose = () => {
    onSave({
      name: activityName,
      description: activityDescription,
      activityNodes: nodes,
      activityEdges: edges
    });
    onClose();
  };

  const handleClose = () => {
    // Auto-save when closing
    saveAndClose();
  };

  // Get node dimensions
  const getNodeDimensions = (node) => {
    const dimensions = {
      'activity-start': { width: 120, height: 120 },
      'activity-end': { width: 120, height: 120 },
      'activity-action': { width: 180, height: 100 },
      'activity-decision': { width: 140, height: 140 },
    };
    return dimensions[node.type] || { width: 150, height: 100 };
  };

  // Auto-layout with ELK
  const handleAutoLayout = useCallback(async () => {
    if (nodes.length === 0) return;

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
      edges: edges.map((edge) => ({
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

      // Fit view after layout
      window.requestAnimationFrame(() => {
        fitView({ padding: 0.2, duration: 300 });
      });
    } catch (error) {
      console.error('Error during auto-layout:', error);
    }
  }, [nodes, edges, setNodes, fitView]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-purple-500 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="bg-purple-600 text-white px-3 py-1 rounded text-lg font-bold w-full"
              placeholder="Activity Name"
            />
            <input
              type="text"
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm w-full mt-2"
              placeholder="Description (optional)"
            />
          </div>
          <button
            onClick={handleClose}
            className="ml-4 p-2 hover:bg-purple-600 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex gap-2 flex-wrap items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleAddNode('activity-start', { label: 'Start' })}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Start
              </button>

              <button
                onClick={() => handleAddNode('activity-action', { label: 'Action', description: '' })}
                className="flex items-center gap-2 px-3 py-2 bg-purple-400 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Action
              </button>

              <button
                onClick={() => handleAddNode('activity-decision', { label: 'Decision' })}
                className="flex items-center gap-2 px-3 py-2 bg-purple-400 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Decision
              </button>

              <button
                onClick={() => handleAddNode('activity-end', { label: 'End' })}
                className="flex items-center gap-2 px-3 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                End
              </button>
            </div>

            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={nodes.length === 0}
            >
              <Sparkles className="w-4 h-4" />
              Auto Layout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
          </div>

          {/* Property Panel */}
          {(selectedNode || selectedEdge) && (
            <ActivityPropertyPanel
              node={selectedNode}
              edge={selectedEdge}
              onUpdateNode={handleNodeUpdate}
              onUpdateEdge={handleEdgeUpdate}
              onDeleteNode={handleNodeDelete}
              onDeleteEdge={handleEdgeDelete}
              onClose={() => {
                setSelectedNode(null);
                setSelectedEdge(null);
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Close & Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ActivityEditorDialog = (props) => {
  return (
    <ReactFlowProvider>
      <ActivityEditorDialogInner {...props} />
    </ReactFlowProvider>
  );
};

export default ActivityEditorDialog;