import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const DB_FILE = join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
let db = {
  projects: {
    'default-project': {
      id: 'default-project',
      name: 'My Enterprise Architecture',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  services: {},
  nodes: {},
  edges: {}
};

// Load database from file
const loadDB = () => {
  if (existsSync(DB_FILE)) {
    try {
      const data = readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log('✅ Database loaded from file');
    } catch (error) {
      console.error('Error loading database:', error);
    }
  } else {
    saveDB();
    console.log('✅ Database initialized');
  }
};

// Save database to file
const saveDB = () => {
  try {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Project operations
export const projectDB = {
  get: (id) => {
    const project = db.projects[id];
    if (!project) return null;

    const services = Object.values(db.services)
      .filter(s => s.project_id === id)
      .map(service => {
        const fullService = serviceDB.get(service.id);
        return fullService || {
          id: service.id,
          name: service.name,
          description: service.description,
          position: service.position,
          nodes: [],
          edges: []
        };
      });

    return {
      ...project,
      services
    };
  },

  update: (id, data) => {
    if (!db.projects[id]) return null;

    db.projects[id] = {
      ...db.projects[id],
      name: data.name,
      updated_at: new Date().toISOString()
    };

    if (data.services !== undefined) {
      // Delete all existing services for this project
      Object.keys(db.services).forEach(serviceId => {
        if (db.services[serviceId].project_id === id) {
          serviceDB.delete(serviceId);
        }
      });

      // Add new services
      data.services.forEach(service => {
        serviceDB.upsert(id, service);
      });
    }

    saveDB();
    return projectDB.get(id);
  }
};

// Service operations
export const serviceDB = {
  create: (projectId, data) => {
    const id = generateId();
    const service = {
      id,
      project_id: projectId,
      name: data.name || 'New Service',
      description: data.description || '',
      position: data.position || { x: 100, y: 100 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.services[id] = service;
    saveDB();

    return serviceDB.get(id);
  },

  get: (id) => {
    const service = db.services[id];
    if (!service) return null;

    const nodes = Object.values(db.nodes)
      .filter(n => n.service_id === id)
      .map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      }));

    const edges = Object.values(db.edges)
      .filter(e => e.service_id === id)
      .map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        label: edge.label,
        description: edge.description
      }));

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      position: service.position,
      nodes,
      edges
    };
  },

  update: (id, data) => {
    if (!db.services[id]) return null;

    db.services[id] = {
      ...db.services[id],
      ...data,
      updated_at: new Date().toISOString()
    };

    saveDB();
    return serviceDB.get(id);
  },

  delete: (id) => {
    // Delete associated nodes and edges
    Object.keys(db.nodes).forEach(nodeId => {
      if (db.nodes[nodeId].service_id === id) {
        delete db.nodes[nodeId];
      }
    });
    Object.keys(db.edges).forEach(edgeId => {
      if (db.edges[edgeId].service_id === id) {
        delete db.edges[edgeId];
      }
    });

    delete db.services[id];
    saveDB();
  },

  upsert: (projectId, service) => {
    if (db.services[service.id]) {
      serviceDB.update(service.id, service);
    } else {
      db.services[service.id] = {
        id: service.id,
        project_id: projectId,
        name: service.name,
        description: service.description || '',
        position: service.position || { x: 100, y: 100 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Update nodes
    if (service.nodes) {
      // Delete existing nodes
      Object.keys(db.nodes).forEach(nodeId => {
        if (db.nodes[nodeId].service_id === service.id) {
          delete db.nodes[nodeId];
        }
      });

      // Insert new nodes
      service.nodes.forEach(node => {
        nodeDB.create(service.id, node);
      });
    }

    // Update edges
    if (service.edges) {
      edgeDB.updateAll(service.id, service.edges);
    }

    saveDB();
  }
};

// Node operations
export const nodeDB = {
  create: (serviceId, data) => {
    const id = data.id || generateId();
    const node = {
      id,
      service_id: serviceId,
      type: data.type,
      position: data.position || { x: 0, y: 0 },
      data: data.data || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.nodes[id] = node;
    saveDB();

    return nodeDB.get(id);
  },

  get: (id) => {
    const node = db.nodes[id];
    if (!node) return null;

    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    };
  },

  update: (id, data) => {
    if (!db.nodes[id]) return null;

    db.nodes[id] = {
      ...db.nodes[id],
      ...data,
      updated_at: new Date().toISOString()
    };

    saveDB();
    return nodeDB.get(id);
  },

  delete: (id) => {
    // Delete associated edges
    Object.keys(db.edges).forEach(edgeId => {
      const edge = db.edges[edgeId];
      if (edge.source === id || edge.target === id) {
        delete db.edges[edgeId];
      }
    });

    delete db.nodes[id];
    saveDB();
  }
};

// Edge operations
export const edgeDB = {
  updateAll: (serviceId, edges) => {
    // Delete all existing edges for this service
    Object.keys(db.edges).forEach(edgeId => {
      if (db.edges[edgeId].service_id === serviceId) {
        delete db.edges[edgeId];
      }
    });

    // Insert new edges
    edges.forEach(edge => {
      db.edges[edge.id] = {
        id: edge.id,
        service_id: serviceId,
        source: edge.source,
        target: edge.target,
        type: edge.type || null,
        label: edge.label || null,
        description: edge.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    saveDB();
    return edges;
  }
};

// Helper function
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Initialize database
loadDB();

export default db;