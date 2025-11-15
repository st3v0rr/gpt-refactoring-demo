#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.EA_BACKEND_URL || 'http://localhost:3001/api';

class EAToolMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ea-tool-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
              name: {
                type: 'string',
                description: 'Service name',
              },
              description: {
                type: 'string',
                description: 'Service description',
              },
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
              serviceId: {
                type: 'string',
                description: 'The service ID to add the entity to',
              },
              name: {
                type: 'string',
                description: 'Entity name',
              },
              fields: {
                type: 'array',
                description: 'Array of fields with name, type, and required flag',
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
                description: 'Position on canvas (x, y)',
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
              serviceId: {
                type: 'string',
                description: 'The service ID to add entities to',
              },
              entities: {
                type: 'array',
                description: 'Array of entities to create',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    fields: {
                      type: 'array',
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
              serviceId: {
                type: 'string',
                description: 'The service ID to add the endpoint to',
              },
              method: {
                type: 'string',
                description: 'HTTP method (GET, POST, PUT, DELETE, PATCH)',
              },
              path: {
                type: 'string',
                description: 'API path (e.g., /api/users)',
              },
              summary: {
                type: 'string',
                description: 'Endpoint summary/description',
              },
              requestFields: {
                type: 'array',
                description: 'Request schema fields',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    validation: { type: 'string' },
                  },
                },
              },
              responseFields: {
                type: 'array',
                description: 'Response schema fields',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    description: { type: 'string' },
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
            required: ['serviceId', 'method', 'path'],
          },
        },
        {
          name: 'create_api_endpoints_bulk',
          description: 'Create multiple API endpoint nodes at once in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'The service ID to add endpoints to',
              },
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
                    position: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                      },
                    },
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
              serviceId: {
                type: 'string',
                description: 'The service ID to add the component to',
              },
              name: {
                type: 'string',
                description: 'Component name',
              },
              componentType: {
                type: 'string',
                description: 'Type of component (page, modal, form, list)',
              },
              description: {
                type: 'string',
                description: 'Component description',
              },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                },
              },
            },
            required: ['serviceId', 'name', 'componentType'],
          },
        },
        {
          name: 'create_ui_components_bulk',
          description: 'Create multiple UI component nodes at once in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'The service ID to add UI components to',
              },
              components: {
                type: 'array',
                description: 'Array of UI components to create',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    componentType: { type: 'string' },
                    description: { type: 'string' },
                    position: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                      },
                    },
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
          description: 'Create a connection (edge) between two nodes',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'The service ID',
              },
              sourceNodeId: {
                type: 'string',
                description: 'Source node ID',
              },
              targetNodeId: {
                type: 'string',
                description: 'Target node ID',
              },
              label: {
                type: 'string',
                description: 'Connection label',
              },
              description: {
                type: 'string',
                description: 'Connection description',
              },
            },
            required: ['serviceId', 'sourceNodeId', 'targetNodeId'],
          },
        },
        {
          name: 'create_connections_bulk',
          description: 'Create multiple connections (edges) at once in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'The service ID',
              },
              connections: {
                type: 'array',
                description: 'Array of connections to create',
                items: {
                  type: 'object',
                  properties: {
                    sourceNodeId: { type: 'string', description: 'Source node ID' },
                    targetNodeId: { type: 'string', description: 'Target node ID' },
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
              serviceId: {
                type: 'string',
                description: 'The service ID',
              },
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
              serviceId: {
                type: 'string',
                description: 'The service ID to add the activity container to',
              },
              name: {
                type: 'string',
                description: 'Activity name',
              },
              description: {
                type: 'string',
                description: 'Activity description',
              },
              activityNodes: {
                type: 'array',
                description: 'Array of activity nodes (start, action, decision, end)',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['activity-start', 'activity-action', 'activity-decision', 'activity-end'],
                    },
                    label: { type: 'string' },
                    description: { type: 'string' },
                    condition: { type: 'string' },
                    actionType: { type: 'string' },
                    position: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                      },
                    },
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
                    sourceIndex: {
                      type: 'number',
                      description: 'Index of source node in activityNodes array',
                    },
                    targetIndex: {
                      type: 'number',
                      description: 'Index of target node in activityNodes array',
                    },
                    label: { type: 'string' },
                    description: { type: 'string' },
                  },
                  required: ['sourceIndex', 'targetIndex'],
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
            required: ['serviceId', 'name', 'activityNodes'],
          },
        },
        {
          name: 'create_activity_containers_bulk',
          description: 'Create multiple activity containers with complete activity diagrams at once',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: {
                type: 'string',
                description: 'The service ID to add activity containers to',
              },
              activities: {
                type: 'array',
                description: 'Array of activity containers to create',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    activityNodes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          label: { type: 'string' },
                          description: { type: 'string' },
                          condition: { type: 'string' },
                          actionType: { type: 'string' },
                          position: {
                            type: 'object',
                            properties: {
                              x: { type: 'number' },
                              y: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                    activityEdges: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          sourceIndex: { type: 'number' },
                          targetIndex: { type: 'number' },
                          label: { type: 'string' },
                          description: { type: 'string' },
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
                  required: ['name', 'activityNodes'],
                },
              },
            },
            required: ['serviceId', 'activities'],
          },
        },
        {
          name: 'create_container',
          description: 'Create a new deployment container node in a service',
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
              position: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
              },
            },
            required: ['serviceId', 'name'],
          },
        },
        {
          name: 'create_database',
          description: 'Create a new deployment database node in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', description: 'Service ID' },
              name: { type: 'string', description: 'Database name' },
              engine: { type: 'string', description: 'Database engine (PostgreSQL, MySQL, MongoDB, etc.)' },
              version: { type: 'string', description: 'Database version' },
              storage: { type: 'string', description: 'Storage size (e.g. "20GB")' },
              backup: { type: 'boolean', description: 'Enable backups' },
              position: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
              },
            },
            required: ['serviceId', 'name', 'engine'],
          },
        },
        {
          name: 'create_queue',
          description: 'Create a new deployment message queue node in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', description: 'Service ID' },
              name: { type: 'string', description: 'Queue name' },
              type: { type: 'string', description: 'Queue type (RabbitMQ, Kafka, SQS, etc.)' },
              maxSize: { type: 'string', description: 'Max queue size' },
              deadLetterQueue: { type: 'boolean', description: 'Enable dead letter queue' },
              position: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
              },
            },
            required: ['serviceId', 'name', 'type'],
          },
        },
        {
          name: 'create_loadbalancer',
          description: 'Create a new deployment load balancer node in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', description: 'Service ID' },
              name: { type: 'string', description: 'Load balancer name' },
              type: { type: 'string', description: 'LB type (Application, Network, etc.)' },
              algorithm: { type: 'string', description: 'Balancing algorithm (Round Robin, Least Connections, etc.)' },
              healthCheck: { type: 'boolean', description: 'Enable health checks' },
              position: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
              },
            },
            required: ['serviceId', 'name', 'type'],
          },
        },
        {
          name: 'create_cache',
          description: 'Create a new deployment cache node in a service',
          inputSchema: {
            type: 'object',
            properties: {
              serviceId: { type: 'string', description: 'Service ID' },
              name: { type: 'string', description: 'Cache name' },
              engine: { type: 'string', description: 'Cache engine (Redis, Memcached, etc.)' },
              ttl: { type: 'string', description: 'Time to live (e.g. "3600s")' },
              evictionPolicy: { type: 'string', description: 'Eviction policy (LRU, LFU, etc.)' },
              position: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
              },
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
                    position: {
                      type: 'object',
                      properties: { x: { type: 'number' }, y: { type: 'number' } },
                    },
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
          description: 'Create a communication connection between two services on the landscape view',
          inputSchema: {
            type: 'object',
            properties: {
              sourceServiceId: {
                type: 'string',
                description: 'Source service ID',
              },
              targetServiceId: {
                type: 'string',
                description: 'Target service ID',
              },
              type: {
                type: 'string',
                enum: ['http', 'grpc', 'message-queue', 'database', 'event', 'sync', 'async'],
                description: 'Connection type',
              },
              protocol: {
                type: 'string',
                description: 'Protocol details',
              },
              description: {
                type: 'string',
                description: 'Description',
              },
            },
            required: ['sourceServiceId', 'targetServiceId', 'type'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_project':
            return await this.getProject();

          case 'create_service':
            return await this.createService(args);

          case 'create_entity':
            return await this.createEntity(args);

          case 'create_entities_bulk':
            return await this.createEntitiesBulk(args);

          case 'create_api_endpoint':
            return await this.createApiEndpoint(args);

          case 'create_api_endpoints_bulk':
            return await this.createApiEndpointsBulk(args);

          case 'create_ui_component':
            return await this.createUIComponent(args);

          case 'create_ui_components_bulk':
            return await this.createUIComponentsBulk(args);

          case 'create_connection':
            return await this.createConnection(args);

          case 'create_connections_bulk':
            return await this.createConnectionsBulk(args);

          case 'list_services':
            return await this.listServices();

          case 'get_service':
            return await this.getService(args);

          case 'create_activity_container':
            return await this.createActivityContainer(args);

          case 'create_activity_containers_bulk':
            return await this.createActivityContainersBulk(args);

          case 'create_container':
            return await this.createContainer(args);

          case 'create_database':
            return await this.createDatabase(args);

          case 'create_queue':
            return await this.createQueue(args);

          case 'create_loadbalancer':
            return await this.createLoadBalancer(args);

          case 'create_cache':
            return await this.createCache(args);

          case 'create_deployment_nodes_bulk':
            return await this.createDeploymentNodesBulk(args);

          case 'create_service_connection':
            return await this.createServiceConnection(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getProject() {
    const response = await fetch(`${API_BASE_URL}/project`);
    const project = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Service created: ${service.name} (ID: ${service.id})`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Entity created: ${args.name} (ID: ${node.id}) with ${fields.length} fields`,
        },
      ],
    };
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
      results.push(`${entity.name} (ID: ${node.id})`);

      yOffset += 200;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} entities:\n${results.join('\n')}`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `API Endpoint created: ${args.method} ${args.path} (ID: ${node.id})`,
        },
      ],
    };
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
      results.push(`${endpoint.method} ${endpoint.path} (ID: ${node.id})`);

      yOffset += 200;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} API endpoints:\n${results.join('\n')}`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `UI Component created: ${args.name} (ID: ${node.id})`,
        },
      ],
    };
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
      results.push(`${component.name} (ID: ${node.id})`);

      yOffset += 200;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} UI components:\n${results.join('\n')}`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Connection created from ${args.sourceNodeId} to ${args.targetNodeId}`,
        },
      ],
    };
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

    const results = newEdges.map(edge => `${edge.source} → ${edge.target}${edge.label ? ` (${edge.label})` : ''}`);

    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} connections:\n${results.join('\n')}`,
        },
      ],
    };
  }

  async listServices() {
    const response = await fetch(`${API_BASE_URL}/project`);
    const project = await response.json();

    const serviceList = project.services.map(s =>
      `- ${s.name} (ID: ${s.id}) - ${s.nodes?.length || 0} nodes`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Services in project:\n${serviceList}`,
        },
      ],
    };
  }

  async getService(args) {
    const response = await fetch(`${API_BASE_URL}/services/${args.serviceId}`);
    const service = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(service, null, 2),
        },
      ],
    };
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
      content: [
        {
          type: 'text',
          text: `Activity Container created: ${args.name} (ID: ${node.id}) with ${nodesWithIds.length} nodes and ${edgesWithIds.length} edges`,
        },
      ],
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
      results.push(`${activity.name} (ID: ${node.id}) - ${nodesWithIds.length} nodes, ${edgesWithIds.length} edges`);

      yOffset += 200;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} activity containers:\n${results.join('\n')}`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Container created: ${args.name} (ID: ${node.id})`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Database created: ${args.name} (${args.engine}) (ID: ${node.id})`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Queue created: ${args.name} (${args.type}) (ID: ${node.id})`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Load Balancer created: ${args.name} (${args.type}) (ID: ${node.id})`,
        },
      ],
    };
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

    return {
      content: [
        {
          type: 'text',
          text: `Cache created: ${args.name} (${args.engine}) (ID: ${node.id})`,
        },
      ],
    };
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
      results.push(`${node.name} (${node.nodeType}) (ID: ${createdNode.id})`);

      yOffset += 200;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Created ${results.length} deployment nodes:\n${results.join('\n')}`,
        },
      ],
    };
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
      content: [
        {
          type: 'text',
          text: `Service connection created: ${args.sourceServiceId} → ${args.targetServiceId} (${args.type})`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EA Tool MCP server running on stdio');
  }
}

const server = new EAToolMCPServer();
server.run().catch(console.error);