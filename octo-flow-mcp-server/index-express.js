#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.EA_BACKEND_URL || 'http://localhost:3001/api';
const PORT = process.env.MCP_EXPRESS_PORT || 3002;

const app = express();

app.use(cors());
app.use(express.json());

class EAToolServer {
  async getProject() {
    const response = await fetch(`${API_BASE_URL}/project`);
    const project = await response.json();
    return project;
  }

  async createService(args) {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: args.name,
        description: args.description || '',
      }),
    });

    const service = await response.json();
    return { message: `Service created: ${service.name} (ID: ${service.id})`, data: service };
  }

  async createEntity(args) {
    const position = args.position || { x: 100, y: 100 };
    const fields = args.fields || [];

    // Add IDs to fields
    const fieldsWithIds = fields.map(field => ({
      ...field,
      id: Math.random().toString(36).substr(2, 9),
    }));

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'entity',
        position,
        data: {
          name: args.name,
          fields: fieldsWithIds,
        },
      }),
    });

    const node = await response.json();
    return { message: `Entity created: ${args.name} (ID: ${node.id}) with ${fields.length} fields`, data: node };
  }

  async createEntitiesBulk(args) {
    const results = [];
    let yOffset = 100;

    for (const entity of args.entities) {
      const position = entity.position || { x: 100, y: yOffset };
      const fields = entity.fields || [];

      const fieldsWithIds = fields.map(field => ({
        ...field,
        id: Math.random().toString(36).substr(2, 9),
      }));

      const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'entity',
          position,
          data: {
            name: entity.name,
            fields: fieldsWithIds,
          },
        }),
      });

      const node = await response.json();
      results.push({ name: entity.name, id: node.id });

      yOffset += 200;
    }

    return { message: `Created ${results.length} entities`, data: results };
  }

  async createApiEndpoint(args) {
    const position = args.position || { x: 400, y: 100 };
    const requestFields = args.requestFields || [];
    const responseFields = args.responseFields || [];

    const requestFieldsWithIds = requestFields.map(field => ({
      ...field,
      id: Math.random().toString(36).substr(2, 9),
    }));

    const responseFieldsWithIds = responseFields.map(field => ({
      ...field,
      id: Math.random().toString(36).substr(2, 9),
    }));

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'api-endpoint',
        position,
        data: {
          method: args.method,
          path: args.path,
          summary: args.summary || '',
          requestFields: requestFieldsWithIds,
          responseFields: responseFieldsWithIds,
        },
      }),
    });

    const node = await response.json();
    return { message: `API Endpoint created: ${args.method} ${args.path} (ID: ${node.id})`, data: node };
  }

  async createApiEndpointsBulk(args) {
    const results = [];
    let yOffset = 100;

    for (const endpoint of args.endpoints) {
      const position = endpoint.position || { x: 400, y: yOffset };
      const requestFields = endpoint.requestFields || [];
      const responseFields = endpoint.responseFields || [];

      const requestFieldsWithIds = requestFields.map(field => ({
        ...field,
        id: Math.random().toString(36).substr(2, 9),
      }));

      const responseFieldsWithIds = responseFields.map(field => ({
        ...field,
        id: Math.random().toString(36).substr(2, 9),
      }));

      const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'api-endpoint',
          position,
          data: {
            method: endpoint.method,
            path: endpoint.path,
            summary: endpoint.summary || '',
            requestFields: requestFieldsWithIds,
            responseFields: responseFieldsWithIds,
          },
        }),
      });

      const node = await response.json();
      results.push({ method: endpoint.method, path: endpoint.path, id: node.id });

      yOffset += 200;
    }

    return { message: `Created ${results.length} API endpoints`, data: results };
  }

  async createUIComponent(args) {
    const position = args.position || { x: 700, y: 100 };

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ui-component',
        position,
        data: {
          name: args.name,
          componentType: args.componentType,
          description: args.description || '',
        },
      }),
    });

    const node = await response.json();
    return { message: `UI Component created: ${args.name} (ID: ${node.id})`, data: node };
  }

  async createUIComponentsBulk(args) {
    const results = [];
    let yOffset = 100;

    for (const component of args.components) {
      const position = component.position || { x: 700, y: yOffset };

      const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ui-component',
          position,
          data: {
            name: component.name,
            componentType: component.componentType,
            description: component.description || '',
          },
        }),
      });

      const node = await response.json();
      results.push({ name: component.name, id: node.id });

      yOffset += 200;
    }

    return { message: `Created ${results.length} UI components`, data: results };
  }

  async createConnection(args) {
    // First, get the service to access edges
    const serviceResponse = await fetch(`${API_BASE_URL}/services/${args.serviceId}`);
    const service = await serviceResponse.json();

    const newEdge = {
      id: Math.random().toString(36).substr(2, 9),
      source: args.sourceNodeId,
      target: args.targetNodeId,
      label: args.label || '',
      description: args.description || '',
    };

    const updatedEdges = [...service.edges, newEdge];

    await fetch(`${API_BASE_URL}/services/${args.serviceId}/edges`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edges: updatedEdges }),
    });

    return { message: `Connection created from ${args.sourceNodeId} to ${args.targetNodeId}`, data: newEdge };
  }

  async createConnectionsBulk(args) {
    // First, get the service to access edges
    const serviceResponse = await fetch(`${API_BASE_URL}/services/${args.serviceId}`);
    const service = await serviceResponse.json();

    const newEdges = args.connections.map(conn => ({
      id: Math.random().toString(36).substr(2, 9),
      source: conn.sourceNodeId,
      target: conn.targetNodeId,
      label: conn.label || '',
      description: conn.description || '',
    }));

    const updatedEdges = [...service.edges, ...newEdges];

    await fetch(`${API_BASE_URL}/services/${args.serviceId}/edges`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edges: updatedEdges }),
    });

    return { message: `Created ${newEdges.length} connections`, data: newEdges };
  }

  async listServices() {
    const response = await fetch(`${API_BASE_URL}/project`);
    const project = await response.json();
    return { services: project.services };
  }

  async getService(args) {
    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}`);
    const service = await response.json();
    return service;
  }

  async createActivityContainer(args) {
    const position = args.position || { x: 100, y: 100 };
    const activityNodes = args.activityNodes || [];
    const activityEdges = args.activityEdges || [];

    // Generate IDs for activity nodes
    const nodesWithIds = activityNodes.map(node => ({
      id: Math.random().toString(36).substr(2, 9),
      type: node.type,
      position: node.position || { x: 100, y: 100 },
      data: {
        label: node.label,
        description: node.description || '',
        condition: node.condition || '',
        actionType: node.actionType || 'process',
      },
    }));

    // Map edges using the generated node IDs
    const edgesWithIds = activityEdges.map(edge => ({
      id: Math.random().toString(36).substr(2, 9),
      source: nodesWithIds[edge.sourceIndex].id,
      target: nodesWithIds[edge.targetIndex].id,
      label: edge.label || '',
      description: edge.description || '',
    }));

    // Create the activity container node
    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'activity-container',
        position,
        data: {
          name: args.name,
          description: args.description || '',
          activityNodes: nodesWithIds,
          activityEdges: edgesWithIds,
        },
      }),
    });

    const node = await response.json();
    return {
      message: `Activity Container created: ${args.name} (ID: ${node.id}) with ${nodesWithIds.length} nodes and ${edgesWithIds.length} edges`,
      data: node
    };
  }

  async createActivityContainersBulk(args) {
    const results = [];
    let yOffset = 100;

    for (const activity of args.activities) {
      const position = activity.position || { x: 100, y: yOffset };
      const activityNodes = activity.activityNodes || [];
      const activityEdges = activity.activityEdges || [];

      // Generate IDs for activity nodes
      const nodesWithIds = activityNodes.map(node => ({
        id: Math.random().toString(36).substr(2, 9),
        type: node.type,
        position: node.position || { x: 100, y: 100 },
        data: {
          label: node.label,
          description: node.description || '',
          condition: node.condition || '',
          actionType: node.actionType || 'process',
        },
      }));

      // Map edges using the generated node IDs
      const edgesWithIds = activityEdges.map(edge => ({
        id: Math.random().toString(36).substr(2, 9),
        source: nodesWithIds[edge.sourceIndex].id,
        target: nodesWithIds[edge.targetIndex].id,
        label: edge.label || '',
        description: edge.description || '',
      }));

      // Create the activity container node
      const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'activity-container',
          position,
          data: {
            name: activity.name,
            description: activity.description || '',
            activityNodes: nodesWithIds,
            activityEdges: edgesWithIds,
          },
        }),
      });

      const node = await response.json();
      results.push({ name: activity.name, id: node.id, nodes: nodesWithIds.length, edges: edgesWithIds.length });

      yOffset += 200;
    }

    return { message: `Created ${results.length} activity containers`, data: results };
  }

  async createContainer(args) {
    const position = args.position || { x: 100, y: 100 };

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'deployment-container',
        position,
        data: {
          name: args.name,
          image: args.image || 'nginx:latest',
          ports: args.ports || [],
          environment: args.environment || [],
          replicas: args.replicas || 1,
        },
      }),
    });

    const node = await response.json();
    return { message: `Container created: ${args.name} (ID: ${node.id})`, data: node };
  }

  async createDatabase(args) {
    const position = args.position || { x: 100, y: 100 };

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'deployment-database',
        position,
        data: {
          name: args.name,
          engine: args.engine,
          version: args.version || 'latest',
          storage: args.storage || '10GB',
          backup: args.backup !== undefined ? args.backup : true,
        },
      }),
    });

    const node = await response.json();
    return { message: `Database created: ${args.name} (${args.engine}) (ID: ${node.id})`, data: node };
  }

  async createQueue(args) {
    const position = args.position || { x: 100, y: 100 };

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'deployment-queue',
        position,
        data: {
          name: args.name,
          type: args.type,
          maxSize: args.maxSize || '10000',
          deadLetterQueue: args.deadLetterQueue !== undefined ? args.deadLetterQueue : false,
        },
      }),
    });

    const node = await response.json();
    return { message: `Queue created: ${args.name} (${args.type}) (ID: ${node.id})`, data: node };
  }

  async createLoadBalancer(args) {
    const position = args.position || { x: 100, y: 100 };

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'deployment-loadbalancer',
        position,
        data: {
          name: args.name,
          type: args.type,
          algorithm: args.algorithm || 'Round Robin',
          healthCheck: args.healthCheck !== undefined ? args.healthCheck : true,
        },
      }),
    });

    const node = await response.json();
    return { message: `Load Balancer created: ${args.name} (${args.type}) (ID: ${node.id})`, data: node };
  }

  async createCache(args) {
    const position = args.position || { x: 100, y: 100 };

    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'deployment-cache',
        position,
        data: {
          name: args.name,
          engine: args.engine,
          ttl: args.ttl || '3600s',
          evictionPolicy: args.evictionPolicy || 'LRU',
        },
      }),
    });

    const node = await response.json();
    return { message: `Cache created: ${args.name} (${args.engine}) (ID: ${node.id})`, data: node };
  }

  async createDeploymentNodesBulk(args) {
    const results = [];
    let yOffset = 100;

    for (const node of args.nodes) {
      const position = node.position || { x: 100, y: yOffset };

      const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: node.nodeType,
          position,
          data: {
            name: node.name,
            ...node.data,
          },
        }),
      });

      const createdNode = await response.json();
      results.push({ name: node.name, type: node.nodeType, id: createdNode.id });

      yOffset += 200;
    }

    return { message: `Created ${results.length} deployment nodes`, data: results };
  }

  async createServiceConnection(args) {
    const response = await fetch(`${API_BASE_URL}/service-connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: args.sourceServiceId,
        target: args.targetServiceId,
        type: args.type,
        protocol: args.protocol || '',
        label: args.type.toUpperCase(),
        description: args.description || '',
      }),
    });

    const connection = await response.json();
    return {
      message: `Service connection created: ${args.sourceServiceId} → ${args.targetServiceId} (${args.type})`,
      data: connection
    };
  }
}

const server = new EAToolServer();

// Routes
app.get('/api/project', async (req, res) => {
  try {
    const result = await server.getProject();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const result = await server.createService(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/entity', async (req, res) => {
  try {
    const result = await server.createEntity({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/entities/bulk', async (req, res) => {
  try {
    const result = await server.createEntitiesBulk({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/api-endpoint', async (req, res) => {
  try {
    const result = await server.createApiEndpoint({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/api-endpoints/bulk', async (req, res) => {
  try {
    const result = await server.createApiEndpointsBulk({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/ui-component', async (req, res) => {
  try {
    const result = await server.createUIComponent({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/ui-components/bulk', async (req, res) => {
  try {
    const result = await server.createUIComponentsBulk({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/connection', async (req, res) => {
  try {
    const result = await server.createConnection({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/connections/bulk', async (req, res) => {
  try {
    const result = await server.createConnectionsBulk({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const result = await server.listServices();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/:serviceId', async (req, res) => {
  try {
    const result = await server.getService({ serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/activity-container', async (req, res) => {
  try {
    const result = await server.createActivityContainer({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/activity-containers/bulk', async (req, res) => {
  try {
    const result = await server.createActivityContainersBulk({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/container', async (req, res) => {
  try {
    const result = await server.createContainer({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/database', async (req, res) => {
  try {
    const result = await server.createDatabase({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/queue', async (req, res) => {
  try {
    const result = await server.createQueue({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/loadbalancer', async (req, res) => {
  try {
    const result = await server.createLoadBalancer({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/cache', async (req, res) => {
  try {
    const result = await server.createCache({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:serviceId/deployment-nodes/bulk', async (req, res) => {
  try {
    const result = await server.createDeploymentNodesBulk({ ...req.body, serviceId: req.params.serviceId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP endpoint - unified tool execution
app.post('/mcp/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    let result;
    switch (name) {
      case 'get_project':
        result = await server.getProject();
        break;
      case 'create_service':
        result = await server.createService(args);
        break;
      case 'create_entity':
        result = await server.createEntity(args);
        break;
      case 'create_entities_bulk':
        result = await server.createEntitiesBulk(args);
        break;
      case 'create_api_endpoint':
        result = await server.createApiEndpoint(args);
        break;
      case 'create_api_endpoints_bulk':
        result = await server.createApiEndpointsBulk(args);
        break;
      case 'create_ui_component':
        result = await server.createUIComponent(args);
        break;
      case 'create_ui_components_bulk':
        result = await server.createUIComponentsBulk(args);
        break;
      case 'create_connection':
        result = await server.createConnection(args);
        break;
      case 'create_connections_bulk':
        result = await server.createConnectionsBulk(args);
        break;
      case 'list_services':
        result = await server.listServices();
        break;
      case 'get_service':
        result = await server.getService(args);
        break;
      case 'create_activity_container':
        result = await server.createActivityContainer(args);
        break;
      case 'create_activity_containers_bulk':
        result = await server.createActivityContainersBulk(args);
        break;
      case 'create_container':
        result = await server.createContainer(args);
        break;
      case 'create_database':
        result = await server.createDatabase(args);
        break;
      case 'create_queue':
        result = await server.createQueue(args);
        break;
      case 'create_loadbalancer':
        result = await server.createLoadBalancer(args);
        break;
      case 'create_cache':
        result = await server.createCache(args);
        break;
      case 'create_deployment_nodes_bulk':
        result = await server.createDeploymentNodesBulk(args);
        break;
      case 'ranc':
        result = await server.createServiceConnection(args);
        break;
      default:
        return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP endpoint for LibreChat streamable-http transport (JSON-RPC 2.0)
app.post('/mcp/tools', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { jsonrpc, method, id, params } = req.body;

    if (jsonrpc !== '2.0') {
      const error = {
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid Request' }
      };
      res.write(`data: ${JSON.stringify(error)}\n\n`);
      res.end();
      return;
    }

    // Handle initialize request
    if (method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'ea-tools',
            version: '1.0.0'
          }
        }
      };
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      res.end();
      return;
    }

    // Handle tools/list request
    if (method === 'tools/list') {
      const tools = [
        {
          name: 'create_service',
          description: 'Create a new service in the project',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Service name' },
              description: { type: 'string', description: 'Service description' },
            },
            required: ['name'],
          },
        },
        {
          name: 'create_entity',
          description: 'Create a new entity node in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', description: 'Service ID' },
              name: { type: 'string', description: 'Entity name' },
              fields: { type: 'array', description: 'Entity fields' },
            },
            required: ['serviceId', 'name'],
          },
        },
        {
          name: 'create_api_endpoint',
          description: 'Create a new API endpoint node',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', description: 'Service ID' },
              method: { type: 'string', description: 'HTTP method' },
              path: { type: 'string', description: 'API path' },
              summary: { type: 'string', description: 'Endpoint summary' },
            },
            required: ['serviceId', 'method', 'path'],
          },
        },
        {
          name: 'create_service_connection',
          description: 'Create a communication connection between two services on the landscape view',
          inputSchema: {
            type: 'object',
            properties: {
              sourceServiceId: { type: 'string', description: 'Source service ID' },
              targetServiceId: { type: 'string', description: 'Target service ID' },
              type: {
                type: 'string',
                enum: ['http', 'grpc', 'message-queue', 'database', 'event', 'sync', 'async'],
                description: 'Connection type'
              },
              protocol: { type: 'string', description: 'Protocol details' },
              description: { type: 'string', description: 'Description' },
            },
            required: ['sourceServiceId', 'targetServiceId', 'type'],
          },
        },
      ];

      const response = {
        jsonrpc: '2.0',
        id,
        result: { tools }
      };
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      res.end();
      return;
    }

    // Handle tools/call request
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      let result;

      switch (name) {
        case 'create_service':
          result = await server.createService(args);
          break;
        case 'create_entity':
          result = await server.createEntity(args);
          break;
        case 'create_api_endpoint':
          result = await server.createApiEndpoint(args);
          break;
        case 'create_service_connection':
          result = await server.createServiceConnection(args);
          break;
        case 'list_services':
          result = await server.listServices();
          break;
        case 'get_service':
          result = await server.getService(args);
          break;
        default:
          const error = {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Unknown tool: ${name}` }
          };
          res.write(`data: ${JSON.stringify(error)}\n\n`);
          res.end();
          return;
      }

      const response = {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(result) }] }
      };
      res.write(`data: ${JSON.stringify(response)}\n\n`);
      res.end();
      return;
    }

    // Unknown method
    const error = {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    };
    res.write(`data: ${JSON.stringify(error)}\n\n`);
    res.end();
  } catch (error) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: req.body.id || null,
      error: { code: -32603, message: error.message }
    };
    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    res.end();
  }
});

// List available tools (MCP format for LibreChat)
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_project',
        description: 'Get the current project with all services',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_service',
        description: 'Create a new service in the project',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Service name' },
            description: { type: 'string', description: 'Service description' },
          },
          required: ['name'],
        },
      },
      {
        name: 'create_entity',
        description: 'Create a new entity node in a service',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Entity name' },
            fields: {
              type: 'array',
              description: 'Array of fields',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                },
              },
            },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
              },
            },
          },
          required: ['serviceId', 'name'],
        },
      },
      {
        name: 'create_entities_bulk',
        description: 'Create multiple entity nodes at once in a service',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            entities: {
              type: 'array',
              description: 'Array of entities to create',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  fields: { type: 'array' },
                  position: { type: 'object' },
                },
                required: ['name'],
              },
            },
          },
          required: ['serviceId', 'entities'],
        },
      },
      {
        name: 'create_api_endpoint',
        description: 'Create a new API endpoint node in a service',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            method: { type: 'string', description: 'HTTP method (GET, POST, PUT, DELETE, PATCH)' },
            path: { type: 'string', description: 'API path (e.g., /api/users)' },
            summary: { type: 'string', description: 'Endpoint summary' },
            requestFields: { type: 'array', description: 'Request schema fields' },
            responseFields: { type: 'array', description: 'Response schema fields' },
            position: { type: 'object' },
          },
          required: ['serviceId', 'method', 'path'],
        },
      },
      {
        name: 'create_api_endpoints_bulk',
        description: 'Create multiple API endpoint nodes at once',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            endpoints: {
              type: 'array',
              description: 'Array of endpoints to create',
              items: {
                type: 'object',
                properties: {
                  method: { type: 'string' },
                  path: { type: 'string' },
                  summary: { type: 'string' },
                  requestFields: { type: 'array' },
                  responseFields: { type: 'array' },
                  position: { type: 'object' },
                },
                required: ['method', 'path'],
              },
            },
          },
          required: ['serviceId', 'endpoints'],
        },
      },
      {
        name: 'create_ui_component',
        description: 'Create a new UI component node in a service',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Component name' },
            componentType: { type: 'string', description: 'Type of component (page, modal, form, list)' },
            description: { type: 'string', description: 'Component description' },
            position: { type: 'object' },
          },
          required: ['serviceId', 'name', 'componentType'],
        },
      },
      {
        name: 'create_ui_components_bulk',
        description: 'Create multiple UI component nodes at once',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            components: {
              type: 'array',
              description: 'Array of UI components to create',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  componentType: { type: 'string' },
                  description: { type: 'string' },
                  position: { type: 'object' },
                },
                required: ['name', 'componentType'],
              },
            },
          },
          required: ['serviceId', 'components'],
        },
      },
      {
        name: 'create_connection',
        description: 'Create a connection (edge) between two nodes. Supported connection types: Entity→Entity (relationship), API→Entity (uses), UI→API (calls), UI→Entity (displays), Activity→Activity (flow), API→ActivityContainer (triggers), ActivityContainer→API (calls API), ActivityAction→Entity (data access)',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            sourceNodeId: { type: 'string', description: 'Source node ID' },
            targetNodeId: { type: 'string', description: 'Target node ID' },
            label: { type: 'string', description: 'Connection label (optional, auto-detected based on node types)' },
            description: { type: 'string', description: 'Connection description' },
            type: {
              type: 'string',
              description: 'Edge type: relationship, uses, calls, displays, flow, triggers, data-access (optional, auto-detected)',
              enum: ['relationship', 'uses', 'calls', 'displays', 'flow', 'triggers', 'data-access']
            },
          },
          required: ['serviceId', 'sourceNodeId', 'targetNodeId'],
        },
      },
      {
        name: 'create_connections_bulk',
        description: 'Create multiple connections at once',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            connections: {
              type: 'array',
              description: 'Array of connections to create',
              items: {
                type: 'object',
                properties: {
                  sourceNodeId: { type: 'string' },
                  targetNodeId: { type: 'string' },
                  label: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['sourceNodeId', 'targetNodeId'],
              },
            },
          },
          required: ['serviceId', 'connections'],
        },
      },
      {
        name: 'list_services',
        description: 'List all services in the project',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_service',
        description: 'Get details of a specific service including all nodes and edges',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
          },
          required: ['serviceId'],
        },
      },
      {
        name: 'create_activity_container',
        description: 'Create an activity container with a complete activity diagram',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Activity name' },
            description: { type: 'string', description: 'Activity description' },
            activityNodes: {
              type: 'array',
              description: 'Array of activity nodes (start, action, decision, end)',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['activity-start', 'activity-action', 'activity-decision', 'activity-end'] },
                  label: { type: 'string' },
                  description: { type: 'string' },
                  condition: { type: 'string' },
                  actionType: { type: 'string' },
                  position: { type: 'object' },
                },
                required: ['type', 'label'],
              },
            },
            activityEdges: {
              type: 'array',
              description: 'Array of connections between nodes',
              items: {
                type: 'object',
                properties: {
                  sourceIndex: { type: 'number', description: 'Index of source node in activityNodes array' },
                  targetIndex: { type: 'number', description: 'Index of target node in activityNodes array' },
                  label: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['sourceIndex', 'targetIndex'],
              },
            },
            position: { type: 'object' },
          },
          required: ['serviceId', 'name', 'activityNodes'],
        },
      },
      {
        name: 'create_activity_containers_bulk',
        description: 'Create multiple activity containers with complete activity diagrams at once',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            activities: {
              type: 'array',
              description: 'Array of activity containers to create',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  activityNodes: { type: 'array' },
                  activityEdges: { type: 'array' },
                  position: { type: 'object' },
                },
                required: ['name', 'activityNodes'],
              },
            },
          },
          required: ['serviceId', 'activities'],
        },
      },
      {
        name: 'create_container',
        description: 'Create a new deployment container node',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Container name' },
            image: { type: 'string', description: 'Docker image (e.g. nginx:latest)' },
            ports: { type: 'array', items: { type: 'string' }, description: 'Port mappings (e.g. ["80:80"])' },
            environment: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  value: { type: 'string' },
                },
              },
              description: 'Environment variables',
            },
            replicas: { type: 'number', description: 'Number of replicas' },
            position: { type: 'object' },
          },
          required: ['serviceId', 'name'],
        },
      },
      {
        name: 'create_database',
        description: 'Create a new deployment database node',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Database name' },
            engine: { type: 'string', description: 'Database engine (PostgreSQL, MySQL, MongoDB, etc.)' },
            version: { type: 'string', description: 'Database version' },
            storage: { type: 'string', description: 'Storage size (e.g. "20GB")' },
            backup: { type: 'boolean', description: 'Enable backups' },
            position: { type: 'object' },
          },
          required: ['serviceId', 'name', 'engine'],
        },
      },
      {
        name: 'create_queue',
        description: 'Create a new deployment message queue node',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Queue name' },
            type: { type: 'string', description: 'Queue type (RabbitMQ, Kafka, SQS, etc.)' },
            maxSize: { type: 'string', description: 'Max queue size' },
            deadLetterQueue: { type: 'boolean', description: 'Enable dead letter queue' },
            position: { type: 'object' },
          },
          required: ['serviceId', 'name', 'type'],
        },
      },
      {
        name: 'create_loadbalancer',
        description: 'Create a new deployment load balancer node',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Load balancer name' },
            type: { type: 'string', description: 'LB type (Application, Network, etc.)' },
            algorithm: { type: 'string', description: 'Balancing algorithm (Round Robin, Least Connections, etc.)' },
            healthCheck: { type: 'boolean', description: 'Enable health checks' },
            position: { type: 'object' },
          },
          required: ['serviceId', 'name', 'type'],
        },
      },
      {
        name: 'create_cache',
        description: 'Create a new deployment cache node',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            name: { type: 'string', description: 'Cache name' },
            engine: { type: 'string', description: 'Cache engine (Redis, Memcached, etc.)' },
            ttl: { type: 'string', description: 'Time to live (e.g. "3600s")' },
            evictionPolicy: { type: 'string', description: 'Eviction policy (LRU, LFU, etc.)' },
            position: { type: 'object' },
          },
          required: ['serviceId', 'name', 'engine'],
        },
      },
      {
        name: 'create_deployment_nodes_bulk',
        description: 'Create multiple deployment nodes at once (containers, databases, queues, load balancers, caches)',
        inputSchema: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'Service ID' },
            nodes: {
              type: 'array',
              description: 'Array of deployment nodes to create',
              items: {
                type: 'object',
                properties: {
                  nodeType: { type: 'string', description: 'deployment-container, deployment-database, deployment-queue, deployment-loadbalancer, deployment-cache' },
                  name: { type: 'string' },
                  data: { type: 'object', description: 'Node-specific data' },
                  position: { type: 'object' },
                },
                required: ['nodeType', 'name'],
              },
            },
          },
          required: ['serviceId', 'nodes'],
        },
      },
      {
        name: 'create_service_connection',
        description: 'Create a communication connection between two services on the landscape view. Connection types: http (HTTP/REST), grpc, message-queue, database, event (event-driven), sync (synchronous), async (asynchronous)',
        inputSchema: {
          type: 'object',
          properties: {
            sourceServiceId: { type: 'string', description: 'Source service ID' },
            targetServiceId: { type: 'string', description: 'Target service ID' },
            type: {
              type: 'string',
              enum: ['http', 'grpc', 'message-queue', 'database', 'event', 'sync', 'async'],
              description: 'Connection type (http, grpc, message-queue, database, event, sync, async)'
            },
            protocol: { type: 'string', description: 'Protocol details (e.g., HTTP/REST, RabbitMQ, Kafka)' },
            description: { type: 'string', description: 'Description of the communication pattern' },
          },
          required: ['sourceServiceId', 'targetServiceId', 'type'],
        },
      },
    ],
  });
});

// OpenAI-compatible chat completions endpoint for LibreChat
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1];

    // Simple response that explains the available tools
    const toolsList = await server.listServices();

    res.json({
      id: 'chatcmpl-' + Math.random().toString(36).substr(2, 9),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'ea-tools',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: `I have access to EA modeling tools. Available services: ${JSON.stringify(toolsList.services)}. You can use /mcp/tools/call endpoint to execute tools.`
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OpenAI-compatible models endpoint
app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'ea-tools',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'ea-tool-mcp-server'
      }
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'EA Tool Express Server' });
});

app.listen(PORT, () => {
  console.log(`EA Tool Express Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp/tools/call`);
  console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/v1/chat/completions`);
});