import { create } from 'zustand';

const API_BASE_URL = 'http://localhost:3001/api';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialState = {
  project: {
    id: 'default-project',
    name: 'My Enterprise Architecture',
    services: [],
    serviceConnections: [] // Service-to-Service communication
  },
  loading: false,
  error: null
};

const useProjectStore = create((set, get) => ({
  ...initialState,

  // Load project from backend
  loadProject: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/project`);
      if (!response.ok) throw new Error('Failed to load project');
      const project = await response.json();
      set({ project, loading: false });
    } catch (error) {
      console.error('Error loading project:', error);
      set({ loading: false, error: error.message });
    }
  },

  // Save project to backend
  saveProject: async () => {
    const state = get();
    try {
      const response = await fetch(`${API_BASE_URL}/project`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.project)
      });
      if (!response.ok) throw new Error('Failed to save project');
    } catch (error) {
      console.error('Error saving project:', error);
      set({ error: error.message });
    }
  },

  // Service Management
  addService: async (name, description = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      if (!response.ok) throw new Error('Failed to create service');
      const newService = await response.json();

      set((state) => ({
        project: {
          ...state.project,
          services: [...state.project.services, newService]
        }
      }));

      await get().saveProject();
      return newService.id;
    } catch (error) {
      console.error('Error adding service:', error);
      set({ error: error.message });
    }
  },

  updateService: async (serviceId, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId ? { ...s, ...updates } : s
        )
      }
    }));
    await get().saveProject();
  },

  deleteService: async (serviceId) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.filter(s => s.id !== serviceId)
      }
    }));
    await get().saveProject();
  },

  getService: (serviceId) => {
    return get().project.services.find(s => s.id === serviceId);
  },

  // Node Management
  addNode: async (serviceId, nodeType, position, data) => {
    const newNode = {
      id: generateId(),
      type: nodeType,
      position,
      data: data || {}
    };
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? { ...s, nodes: [...s.nodes, newNode] }
            : s
        )
      }
    }));
    await get().saveProject();
    return newNode.id;
  },

  updateNode: (serviceId, nodeId, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? {
                ...s,
                nodes: s.nodes.map(n =>
                  n.id === nodeId ? { ...n, ...updates } : n
                )
              }
            : s
        )
      }
    }));
    // Save asynchronously without blocking
    get().saveProject();
  },

  deleteNode: async (serviceId, nodeId) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? {
                ...s,
                nodes: s.nodes.filter(n => n.id !== nodeId),
                edges: s.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
              }
            : s
        )
      }
    }));
    await get().saveProject();
  },

  updateNodesPositions: async (serviceId, nodes) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? { ...s, nodes }
            : s
        )
      }
    }));
    await get().saveProject();
  },

  // Edge Management
  addEdge: async (serviceId, edge) => {
    const newEdge = {
      ...edge,
      id: generateId()
    };
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? { ...s, edges: [...s.edges, newEdge] }
            : s
        )
      }
    }));
    await get().saveProject();
  },

  updateEdge: async (serviceId, edgeId, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? {
                ...s,
                edges: s.edges.map(e =>
                  e.id === edgeId ? { ...e, ...updates } : e
                )
              }
            : s
        )
      }
    }));
    await get().saveProject();
  },

  deleteEdge: async (serviceId, edgeId) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? { ...s, edges: s.edges.filter(e => e.id !== edgeId) }
            : s
        )
      }
    }));
    await get().saveProject();
  },

  updateEdges: async (serviceId, edges) => {
    set((state) => ({
      project: {
        ...state.project,
        services: state.project.services.map(s =>
          s.id === serviceId
            ? { ...s, edges }
            : s
        )
      }
    }));
    await get().saveProject();
  },

  // Service Connection Management
  addServiceConnection: async (connection) => {
    const newConnection = {
      ...connection,
      id: generateId()
    };
    set((state) => ({
      project: {
        ...state.project,
        serviceConnections: [...(state.project.serviceConnections || []), newConnection]
      }
    }));
    await get().saveProject();
  },

  updateServiceConnection: async (connectionId, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        serviceConnections: (state.project.serviceConnections || []).map(c =>
          c.id === connectionId ? { ...c, ...updates } : c
        )
      }
    }));
    await get().saveProject();
  },

  deleteServiceConnection: async (connectionId) => {
    set((state) => ({
      project: {
        ...state.project,
        serviceConnections: (state.project.serviceConnections || []).filter(c => c.id !== connectionId)
      }
    }));
    await get().saveProject();
  },

  // Clear all data
  clearAll: async () => {
    set({
      project: {
        id: 'default-project',
        name: 'My Enterprise Architecture',
        services: [],
        serviceConnections: []
      }
    });
    await get().saveProject();
  },

  // Legacy LocalStorage methods (kept for backwards compatibility)
  saveToLocalStorage: async () => {
    await get().saveProject();
  },

  loadFromLocalStorage: async () => {
    await get().loadProject();
  },

  exportProject: () => {
    const state = get();
    const dataStr = JSON.stringify(state.project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.project.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importProject: (projectData) => {
    set({ project: projectData });
    get().saveToLocalStorage();
  }
}));

export default useProjectStore;