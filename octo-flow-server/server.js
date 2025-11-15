import express from 'express';
import cors from 'cors';
import { projectDB, serviceDB, nodeDB, edgeDB } from './database.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const currentProjectId = 'default-project';

// GET current project
app.get('/api/project', (req, res) => {
  try {
    const project = projectDB.get(currentProjectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE entire project
app.put('/api/project', (req, res) => {
  try {
    const project = req.body;
    if (!project || !project.id) {
      return res.status(400).json({ error: 'Invalid project data' });
    }

    const updatedProject = projectDB.update(project.id, project);
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE new service
app.post('/api/services', (req, res) => {
  try {
    const { name, description } = req.body;
    const newService = serviceDB.create(currentProjectId, {
      name: name || 'New Service',
      description: description || '',
      position: { x: 100, y: 100 }
    });

    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE service
app.put('/api/services/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params;
    const updates = req.body;

    const updatedService = serviceDB.update(serviceId, updates);
    if (!updatedService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE service
app.delete('/api/services/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params;
    serviceDB.delete(serviceId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single service
app.get('/api/services/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = serviceDB.get(serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE node in service
app.post('/api/services/:serviceId/nodes', (req, res) => {
  try {
    const { serviceId } = req.params;
    const { type, position, data } = req.body;

    const newNode = nodeDB.create(serviceId, {
      type: type,
      position: position,
      data: data || {}
    });

    res.status(201).json(newNode);
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE node in service
app.put('/api/services/:serviceId/nodes/:nodeId', (req, res) => {
  try {
    const { nodeId } = req.params;
    const updates = req.body;

    const updatedNode = nodeDB.update(nodeId, updates);
    if (!updatedNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    res.json(updatedNode);
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE node from service
app.delete('/api/services/:serviceId/nodes/:nodeId', (req, res) => {
  try {
    const { nodeId } = req.params;
    nodeDB.delete(nodeId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE edges in service
app.put('/api/services/:serviceId/edges', (req, res) => {
  try {
    const { serviceId } = req.params;
    const { edges } = req.body;

    const updatedEdges = edgeDB.updateAll(serviceId, edges);
    res.json(updatedEdges);
  } catch (error) {
    console.error('Error updating edges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE service connection (landscape level)
app.post('/api/service-connections', (req, res) => {
  try {
    const { source, target, type, protocol, label, description } = req.body;

    // Get current project
    const project = projectDB.get('default-project');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const newConnection = {
      id: Math.random().toString(36).substr(2, 9),
      source,
      target,
      type,
      protocol: protocol || '',
      label: label || type.toUpperCase(),
      description: description || ''
    };

    const updatedProject = {
      ...project,
      serviceConnections: [...(project.serviceConnections || []), newConnection]
    };

    projectDB.update('default-project', updatedProject);
    res.status(201).json(newConnection);
  } catch (error) {
    console.error('Error creating service connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: 'JSON'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EA Tool Backend running on http://localhost:${PORT}`);
  console.log(`💾 JSON database initialized`);
});