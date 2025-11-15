const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j Konfiguration
const NEO4J_URL = process.env.NEO4J_URL || 'http://neo4j:7474';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'testpass';
const NEO4J_AUTH = 'Basic ' + Buffer.from(`${NEO4J_USERNAME}:${NEO4J_PASSWORD}`).toString('base64');

// MCP Tools Definition
const tools = [
    {
        name: 'get_schema',
        description: 'Get the complete Neo4j database schema including node labels, relationship types, and property keys',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'read_code_analysis',
        description: 'Execute a read-only Cypher query on the Neo4j database. Use this for SELECT-like operations.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The Cypher query to execute (read-only operations like MATCH, RETURN)'
                },
                params: {
                    type: 'object',
                    description: 'Parameters for the Cypher query',
                    default: {}
                }
            },
            required: ['query']
        }
    },
    {
        name: 'write_code_analysis',
        description: 'Execute a write Cypher query on the Neo4j database. Use this for CREATE, UPDATE, DELETE operations.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The Cypher query to execute (write operations like CREATE, UPDATE, DELETE, MERGE)'
                },
                params: {
                    type: 'object',
                    description: 'Parameters for the Cypher query',
                    default: {}
                }
            },
            required: ['query']
        }
    },
    {
        name: 'get_code_analysis_info',
        description: 'Get general information about the Neo4j database including node count, relationship count, and indexes',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'list_indexes',
        description: 'List all indexes in the Neo4j database',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    }
];

// Neo4j Helper Functions
async function executeCypher(statements, timeout = 15000) {
    try {
        const response = await axios.post(`${NEO4J_URL}/db/neo4j/tx/commit`, {
            statements: statements
        }, {
            headers: {
                'Authorization': NEO4J_AUTH,
                'Content-Type': 'application/json'
            },
            timeout: timeout
        });
        return response.data;
    } catch (error) {
        throw new Error(`Neo4j connection failed: ${error.message}`);
    }
}

function formatCypherResult(data) {
    if (data.errors && data.errors.length > 0) {
        return {
            success: false,
            error: data.errors[0].message,
            code: data.errors[0].code
        };
    }

    return {
        success: true,
        results: data.results.map(result => ({
            columns: result.columns || [],
            data: result.data || [],
            summary: result.summary || {},
            stats: result.stats || {}
        }))
    };
}

// MCP JSON-RPC Handler
app.post('/mcp', async (req, res) => {
    const { method, params, id } = req.body;

    console.log(`[Neo4j MCP] ${new Date().toISOString()} - ${method}`, params ? JSON.stringify(params, null, 2) : '');

    const jsonRpcResponse = (result, error = null) => {
        const response = { jsonrpc: '2.0' };
        if (id !== undefined) response.id = id;
        if (error) response.error = error;
        else response.result = result;
        return response;
    };

    try {
        switch (method) {
            case 'initialize':
                console.log('[Neo4j MCP] Initializing MCP server...');
                return res.json(jsonRpcResponse({
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {},
                        resources: {},
                        prompts: {}
                    },
                    serverInfo: {
                        name: 'neo4j-mcp-server',
                        version: '1.0.0',
                        description: 'Direct Neo4j MCP Server with full Cypher support'
                    }
                }));

            case 'ping':
                return res.json(jsonRpcResponse({}));

            case 'notifications/initialized':
                console.log('[Neo4j MCP] Client initialized successfully');
                return res.json(jsonRpcResponse({}));

            case 'tools/list':
                console.log(`[Neo4j MCP] Listing ${tools.length} available tools`);
                return res.json(jsonRpcResponse({ tools }));

            case 'tools/call':
                const { name: toolName, arguments: args } = params;
                console.log(`[Neo4j MCP] Executing tool: ${toolName}`);

                let result;

                switch (toolName) {
                    case 'get_schema':
                        try {
                            const data = await executeCypher([
                                { statement: "CALL db.labels() YIELD label RETURN label ORDER BY label" },
                                { statement: "CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType" },
                                { statement: "CALL db.propertyKeys() YIELD propertyKey RETURN propertyKey ORDER BY propertyKey" }
                            ]);

                            const formatted = formatCypherResult(data);
                            if (!formatted.success) {
                                result = formatted;
                            } else {
                                result = {
                                    success: true,
                                    schema: {
                                        nodeLabels: formatted.results[0]?.data?.map(row => row.row[0]) || [],
                                        relationshipTypes: formatted.results[1]?.data?.map(row => row.row[0]) || [],
                                        propertyKeys: formatted.results[2]?.data?.map(row => row.row[0]) || []
                                    },
                                    summary: {
                                        totalLabels: formatted.results[0]?.data?.length || 0,
                                        totalRelationshipTypes: formatted.results[1]?.data?.length || 0,
                                        totalPropertyKeys: formatted.results[2]?.data?.length || 0
                                    }
                                };
                            }
                        } catch (error) {
                            result = {
                                success: false,
                                error: error.message,
                                tool: 'get_schema'
                            };
                        }
                        break;

                    case 'get_code_analysis_info':
                        try {
                            const data = await executeCypher([
                                { statement: "MATCH (n) RETURN count(n) as nodeCount" },
                                { statement: "MATCH ()-[r]->() RETURN count(r) as relationshipCount" },
                                { statement: "CALL db.info() YIELD name, value RETURN name, value" }
                            ]);

                            const formatted = formatCypherResult(data);
                            if (!formatted.success) {
                                result = formatted;
                            } else {
                                result = {
                                    success: true,
                                    database: {
                                        nodeCount: formatted.results[0]?.data?.[0]?.row?.[0] || 0,
                                        relationshipCount: formatted.results[1]?.data?.[0]?.row?.[0] || 0,
                                        info: formatted.results[2]?.data?.map(row => ({
                                            name: row.row[0],
                                            value: row.row[1]
                                        })) || []
                                    }
                                };
                            }
                        } catch (error) {
                            result = {
                                success: false,
                                error: error.message,
                                tool: 'get_code_analysis_info'
                            };
                        }
                        break;

                    case 'list_indexes':
                        try {
                            const data = await executeCypher([
                                { statement: "SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties, state RETURN name, type, entityType, labelsOrTypes, properties, state" }
                            ]);

                            const formatted = formatCypherResult(data);
                            if (!formatted.success) {
                                result = formatted;
                            } else {
                                result = {
                                    success: true,
                                    indexes: formatted.results[0]?.data?.map(row => ({
                                        name: row.row[0],
                                        type: row.row[1],
                                        entityType: row.row[2],
                                        labelsOrTypes: row.row[3],
                                        properties: row.row[4],
                                        state: row.row[5]
                                    })) || []
                                };
                            }
                        } catch (error) {
                            result = {
                                success: false,
                                error: error.message,
                                tool: 'list_indexes'
                            };
                        }
                        break;

                    case 'read_code_analysis':
                        try {
                            if (!args.query) {
                                result = {
                                    success: false,
                                    error: 'Query parameter is required'
                                };
                                break;
                            }

                            console.log(`[Neo4j MCP] Executing READ query: ${args.query}`);
                            const data = await executeCypher([{
                                statement: args.query,
                                parameters: args.params || {}
                            }]);

                            result = formatCypherResult(data);
                            result.query = args.query;
                            result.parameters = args.params || {};
                        } catch (error) {
                            result = {
                                success: false,
                                error: error.message,
                                query: args.query,
                                tool: 'read_code_analysis'
                            };
                        }
                        break;

                    case 'write_code_analysis':
                        try {
                            if (!args.query) {
                                result = {
                                    success: false,
                                    error: 'Query parameter is required'
                                };
                                break;
                            }

                            console.log(`[Neo4j MCP] Executing WRITE query: ${args.query}`);
                            const data = await executeCypher([{
                                statement: args.query,
                                parameters: args.params || {}
                            }]);

                            result = formatCypherResult(data);
                            result.query = args.query;
                            result.parameters = args.params || {};
                        } catch (error) {
                            result = {
                                success: false,
                                error: error.message,
                                query: args.query,
                                tool: 'write_code_analysis'
                            };
                        }
                        break;

                    default:
                        console.log(`[Neo4j MCP] Unknown tool: ${toolName}`);
                        return res.json(jsonRpcResponse(null, {
                            code: -32601,
                            message: `Tool '${toolName}' not found`
                        }));
                }

                return res.json(jsonRpcResponse({
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
                }));

            case 'resources/list':
                return res.json(jsonRpcResponse({ resources: [] }));

            case 'prompts/list':
                return res.json(jsonRpcResponse({ prompts: [] }));

            default:
                console.log(`[Neo4j MCP] Unknown method: ${method}`);
                return res.json(jsonRpcResponse(null, {
                    code: -32601,
                    message: `Method '${method}' not found`
                }));
        }
    } catch (error) {
        console.error(`[Neo4j MCP] Error processing ${method}:`, error);
        return res.json(jsonRpcResponse(null, {
            code: -32603,
            message: error.message
        }));
    }
});

// Health Check
app.get('/health', async (req, res) => {
    try {
        await executeCypher([{ statement: "RETURN 1 as health_check" }], 3000);
        res.json({
            status: 'healthy',
            server: 'neo4j-mcp-server',
            version: '1.0.0',
            tools: tools.length,
            neo4j: {
                url: NEO4J_URL,
                connection: 'connected'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            server: 'neo4j-mcp-server',
            version: '1.0.0',
            tools: tools.length,
            neo4j: {
                url: NEO4J_URL,
                connection: 'failed',
                error: error.message
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Info Endpoint
app.get('/mcp', (req, res) => {
    res.json({
        protocol: 'mcp',
        version: '2024-11-05',
        server: 'neo4j-mcp-server',
        description: 'Direct Neo4j MCP Server with full Cypher support',
        capabilities: {
            tools: true,
            resources: false,
            prompts: false
        },
        tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description
        })),
        neo4j: {
            url: NEO4J_URL,
            database: 'neo4j'
        }
    });
});

// Test Endpoint
app.get('/test', async (req, res) => {
    try {
        const data = await executeCypher([
            { statement: "CALL db.labels() YIELD label RETURN count(label) as labelCount" },
            { statement: "MATCH (n) RETURN count(n) as nodeCount LIMIT 1" }
        ], 5000);

        const formatted = formatCypherResult(data);
        res.json({
            test: 'passed',
            neo4j_connection: 'working',
            results: formatted
        });
    } catch (error) {
        res.status(500).json({
            test: 'failed',
            neo4j_connection: 'failed',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 8003;
app.listen(PORT, () => {
    console.log('=====================================');
    console.log('  Neo4j MCP Server Started');
    console.log('=====================================');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Test: http://localhost:${PORT}/test`);
    console.log(`📋 Info: http://localhost:${PORT}/mcp`);
    console.log(`🗄️  Neo4j: ${NEO4J_URL}`);
    console.log(`🛠️  Tools: ${tools.length} available`);
    console.log(`📡 MCP Endpoint: /mcp`);
    console.log('=====================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Neo4j MCP] Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[Neo4j MCP] Server shutting down gracefully...');
    process.exit(0);
});
