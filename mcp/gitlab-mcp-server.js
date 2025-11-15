const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// GitLab Configuration
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com';
const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
const GITLAB_API_URL = `${GITLAB_URL}/api/v4`;

// Helper function to make GitLab API requests
async function gitlabRequest(endpoint, method = 'GET', data = null, params = {}) {
    try {
        const config = {
            method,
            url: `${GITLAB_API_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${GITLAB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        };

        if (data) {
            config.data = data;
        }

        if (Object.keys(params).length > 0) {
            config.params = params;
        }

        const response = await axios(config);
        return {
            success: true,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status || 500
        };
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
}

// MCP Tools Definition with Git Operations
const tools = [
    {
        name: 'list_projects',
        description: 'List GitLab projects with optional filtering',
        inputSchema: {
            type: 'object',
            properties: {
                owned: {
                    type: 'boolean',
                    description: 'Show only owned projects',
                    default: false
                },
                search: {
                    type: 'string',
                    description: 'Search projects by name'
                },
                per_page: {
                    type: 'number',
                    description: 'Number of projects per page (max 100)',
                    default: 20
                },
                order_by: {
                    type: 'string',
                    enum: ['id', 'name', 'path', 'created_at', 'updated_at', 'last_activity_at'],
                    default: 'last_activity_at'
                },
                sort: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                    default: 'desc'
                }
            },
            required: []
        }
    },
    {
        name: 'get_project',
        description: 'Get detailed information about a specific project',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path (e.g., "123" or "group/project-name")'
                }
            },
            required: ['project_id']
        }
    },
    {
        name: 'list_merge_requests',
        description: 'List merge requests for a project or globally',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path (optional for global MRs)'
                },
                state: {
                    type: 'string',
                    enum: ['opened', 'closed', 'locked', 'merged'],
                    default: 'opened'
                },
                author_id: {
                    type: 'number',
                    description: 'Filter by author user ID'
                },
                assignee_id: {
                    type: 'number',
                    description: 'Filter by assignee user ID'
                },
                per_page: {
                    type: 'number',
                    default: 20
                }
            },
            required: []
        }
    },
    {
        name: 'get_merge_request',
        description: 'Get detailed information about a specific merge request',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                merge_request_iid: {
                    type: 'number',
                    description: 'Merge request IID (internal ID)'
                }
            },
            required: ['project_id', 'merge_request_iid']
        }
    },
    {
        name: 'create_merge_request',
        description: 'Create a new merge request',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                source_branch: {
                    type: 'string',
                    description: 'Source branch name'
                },
                target_branch: {
                    type: 'string',
                    description: 'Target branch name',
                    default: 'main'
                },
                title: {
                    type: 'string',
                    description: 'Merge request title'
                },
                description: {
                    type: 'string',
                    description: 'Merge request description'
                },
                assignee_id: {
                    type: 'number',
                    description: 'Assignee user ID'
                },
                remove_source_branch: {
                    type: 'boolean',
                    description: 'Remove source branch when MR is accepted',
                    default: false
                }
            },
            required: ['project_id', 'source_branch', 'target_branch', 'title']
        }
    },
    {
        name: 'list_issues',
        description: 'List issues for a project or globally',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path (optional for global issues)'
                },
                state: {
                    type: 'string',
                    enum: ['opened', 'closed'],
                    default: 'opened'
                },
                author_id: {
                    type: 'number',
                    description: 'Filter by author user ID'
                },
                assignee_id: {
                    type: 'number',
                    description: 'Filter by assignee user ID'
                },
                labels: {
                    type: 'string',
                    description: 'Comma-separated list of label names'
                },
                per_page: {
                    type: 'number',
                    default: 20
                }
            },
            required: []
        }
    },
    {
        name: 'get_issue',
        description: 'Get detailed information about a specific issue',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                issue_iid: {
                    type: 'number',
                    description: 'Issue IID (internal ID)'
                }
            },
            required: ['project_id', 'issue_iid']
        }
    },
    {
        name: 'create_issue',
        description: 'Create a new issue in a project',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                title: {
                    type: 'string',
                    description: 'Issue title'
                },
                description: {
                    type: 'string',
                    description: 'Issue description'
                },
                assignee_ids: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Array of user IDs to assign'
                },
                labels: {
                    type: 'string',
                    description: 'Comma-separated list of label names'
                }
            },
            required: ['project_id', 'title']
        }
    },
    {
        name: 'list_branches',
        description: 'List repository branches',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                search: {
                    type: 'string',
                    description: 'Search branches by name'
                },
                per_page: {
                    type: 'number',
                    default: 20
                }
            },
            required: ['project_id']
        }
    },
    {
        name: 'create_branch',
        description: 'Create a new branch in the repository',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                branch: {
                    type: 'string',
                    description: 'Name of the new branch'
                },
                ref: {
                    type: 'string',
                    description: 'Source branch/tag/commit to branch from',
                    default: 'main'
                }
            },
            required: ['project_id', 'branch']
        }
    },
    {
        name: 'list_commits',
        description: 'List repository commits',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                ref_name: {
                    type: 'string',
                    description: 'Branch or tag name',
                    default: 'main'
                },
                since: {
                    type: 'string',
                    description: 'Only commits after this date (ISO 8601)'
                },
                until: {
                    type: 'string',
                    description: 'Only commits before this date (ISO 8601)'
                },
                author: {
                    type: 'string',
                    description: 'Filter by author name or email'
                },
                per_page: {
                    type: 'number',
                    default: 20
                }
            },
            required: ['project_id']
        }
    },
    {
        name: 'commit_files',
        description: 'Commit multiple files to a branch in one commit',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                branch: {
                    type: 'string',
                    description: 'Target branch name'
                },
                commit_message: {
                    type: 'string',
                    description: 'Commit message'
                },
                actions: {
                    type: 'array',
                    description: 'Array of file actions to perform',
                    items: {
                        type: 'object',
                        properties: {
                            action: {
                                type: 'string',
                                enum: ['create', 'delete', 'move', 'update'],
                                description: 'Action to perform on the file'
                            },
                            file_path: {
                                type: 'string',
                                description: 'Path to the file'
                            },
                            content: {
                                type: 'string',
                                description: 'File content (for create/update actions)'
                            },
                            encoding: {
                                type: 'string',
                                enum: ['text', 'base64'],
                                default: 'text',
                                description: 'File content encoding'
                            },
                            previous_path: {
                                type: 'string',
                                description: 'Previous file path (for move action)'
                            }
                        },
                        required: ['action', 'file_path']
                    }
                },
                author_email: {
                    type: 'string',
                    description: 'Author email (optional)'
                },
                author_name: {
                    type: 'string',
                    description: 'Author name (optional)'
                }
            },
            required: ['project_id', 'branch', 'commit_message', 'actions']
        }
    },
    {
        name: 'create_file',
        description: 'Create a single new file in the repository',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                file_path: {
                    type: 'string',
                    description: 'Path where to create the file'
                },
                branch: {
                    type: 'string',
                    description: 'Target branch name'
                },
                content: {
                    type: 'string',
                    description: 'File content'
                },
                commit_message: {
                    type: 'string',
                    description: 'Commit message'
                },
                encoding: {
                    type: 'string',
                    enum: ['text', 'base64'],
                    default: 'text',
                    description: 'Content encoding'
                },
                author_email: {
                    type: 'string',
                    description: 'Author email (optional)'
                },
                author_name: {
                    type: 'string',
                    description: 'Author name (optional)'
                }
            },
            required: ['project_id', 'file_path', 'branch', 'content', 'commit_message']
        }
    },
    {
        name: 'update_file',
        description: 'Update an existing file in the repository',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                file_path: {
                    type: 'string',
                    description: 'Path to the file to update'
                },
                branch: {
                    type: 'string',
                    description: 'Target branch name'
                },
                content: {
                    type: 'string',
                    description: 'New file content'
                },
                commit_message: {
                    type: 'string',
                    description: 'Commit message'
                },
                encoding: {
                    type: 'string',
                    enum: ['text', 'base64'],
                    default: 'text',
                    description: 'Content encoding'
                },
                author_email: {
                    type: 'string',
                    description: 'Author email (optional)'
                },
                author_name: {
                    type: 'string',
                    description: 'Author name (optional)'
                }
            },
            required: ['project_id', 'file_path', 'branch', 'content', 'commit_message']
        }
    },
    {
        name: 'delete_file',
        description: 'Delete a file from the repository',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                file_path: {
                    type: 'string',
                    description: 'Path to the file to delete'
                },
                branch: {
                    type: 'string',
                    description: 'Target branch name'
                },
                commit_message: {
                    type: 'string',
                    description: 'Commit message'
                },
                author_email: {
                    type: 'string',
                    description: 'Author email (optional)'
                },
                author_name: {
                    type: 'string',
                    description: 'Author name (optional)'
                }
            },
            required: ['project_id', 'file_path', 'branch', 'commit_message']
        }
    },
    {
        name: 'get_file_content',
        description: 'Get content of a specific file from repository',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                file_path: {
                    type: 'string',
                    description: 'Path to the file'
                },
                ref: {
                    type: 'string',
                    description: 'Branch, tag or commit SHA',
                    default: 'main'
                }
            },
            required: ['project_id', 'file_path']
        }
    },
    {
        name: 'get_pipeline_status',
        description: 'Get CI/CD pipeline status for a project',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: {
                    type: 'string',
                    description: 'Project ID or path'
                },
                ref: {
                    type: 'string',
                    description: 'Branch or tag name',
                    default: 'main'
                },
                per_page: {
                    type: 'number',
                    default: 10
                }
            },
            required: ['project_id']
        }
    },
    {
        name: 'get_user_activity',
        description: 'Get current user information and recent activity',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'search_code',
        description: 'Search for code across projects',
        inputSchema: {
            type: 'object',
            properties: {
                search: {
                    type: 'string',
                    description: 'Search query'
                },
                project_id: {
                    type: 'string',
                    description: 'Limit search to specific project (optional)'
                },
                per_page: {
                    type: 'number',
                    default: 20
                }
            },
            required: ['search']
        }
    }
];

// MCP JSON-RPC Handler
app.post('/mcp', async (req, res) => {
    const { method, params, id } = req.body;

    console.log(`[GitLab MCP] ${new Date().toISOString()} - ${method}`);

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
                console.log('[GitLab MCP] Initializing server...');
                return res.json(jsonRpcResponse({
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {}, resources: {}, prompts: {} },
                    serverInfo: {
                        name: 'gitlab-mcp-server',
                        version: '2.0.0',
                        description: 'GitLab integration with Git operations for LibreChat'
                    }
                }));

            case 'ping':
                return res.json(jsonRpcResponse({}));

            case 'notifications/initialized':
                return res.json(jsonRpcResponse({}));

            case 'tools/list':
                return res.json(jsonRpcResponse({ tools }));

            case 'tools/call':
                const { name: toolName, arguments: args } = params;
                console.log(`[GitLab MCP] Executing: ${toolName}`);

                let result;

                switch (toolName) {
                    case 'list_projects':
                        try {
                            const queryParams = {
                                per_page: args.per_page || 20,
                                order_by: args.order_by || 'last_activity_at',
                                sort: args.sort || 'desc'
                            };

                            if (args.owned) queryParams.owned = true;
                            if (args.search) queryParams.search = args.search;

                            const response = await gitlabRequest('/projects', 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    projects: response.data.map(project => ({
                                        id: project.id,
                                        name: project.name,
                                        path: project.path,
                                        full_path: project.path_with_namespace,
                                        description: project.description,
                                        visibility: project.visibility,
                                        last_activity: formatDate(project.last_activity_at),
                                        created_at: formatDate(project.created_at),
                                        web_url: project.web_url,
                                        stars: project.star_count,
                                        forks: project.forks_count
                                    })),
                                    total: response.data.length
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'get_project':
                        try {
                            const response = await gitlabRequest(`/projects/${encodeURIComponent(args.project_id)}`);

                            if (response.success) {
                                const project = response.data;
                                result = {
                                    success: true,
                                    project: {
                                        id: project.id,
                                        name: project.name,
                                        path: project.path_with_namespace,
                                        description: project.description,
                                        visibility: project.visibility,
                                        web_url: project.web_url,
                                        repository: {
                                            ssh_url: project.ssh_url_to_repo,
                                            http_url: project.http_url_to_repo,
                                            default_branch: project.default_branch
                                        },
                                        statistics: {
                                            commit_count: project.commit_count,
                                            storage_size: project.storage_size,
                                            repository_size: project.repository_size,
                                            stars: project.star_count,
                                            forks: project.forks_count
                                        },
                                        dates: {
                                            created: formatDate(project.created_at),
                                            updated: formatDate(project.updated_at),
                                            last_activity: formatDate(project.last_activity_at)
                                        }
                                    }
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'create_branch':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/branches`;
                            const branchData = {
                                branch: args.branch,
                                ref: args.ref || 'main'
                            };

                            const response = await gitlabRequest(endpoint, 'POST', branchData);

                            if (response.success) {
                                const branch = response.data;
                                result = {
                                    success: true,
                                    branch: {
                                        name: branch.name,
                                        commit: {
                                            id: branch.commit.id,
                                            short_id: branch.commit.short_id,
                                            title: branch.commit.title,
                                            author: branch.commit.author_name,
                                            created_at: formatDate(branch.commit.created_at)
                                        },
                                        web_url: branch.web_url
                                    },
                                    message: `Branch "${args.branch}" created successfully from "${args.ref || 'main'}"`
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'commit_files':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/commits`;
                            const commitData = {
                                branch: args.branch,
                                commit_message: args.commit_message,
                                actions: args.actions
                            };

                            if (args.author_email) commitData.author_email = args.author_email;
                            if (args.author_name) commitData.author_name = args.author_name;

                            const response = await gitlabRequest(endpoint, 'POST', commitData);

                            if (response.success) {
                                const commit = response.data;
                                result = {
                                    success: true,
                                    commit: {
                                        id: commit.id,
                                        short_id: commit.short_id,
                                        title: commit.title,
                                        message: commit.message,
                                        author: commit.author_name,
                                        author_email: commit.author_email,
                                        created_at: formatDate(commit.created_at),
                                        web_url: commit.web_url
                                    },
                                    actions_count: args.actions.length,
                                    branch: args.branch,
                                    message: `Successfully committed ${args.actions.length} file(s) to branch "${args.branch}"`
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'create_file':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/files/${encodeURIComponent(args.file_path)}`;
                            const fileData = {
                                branch: args.branch,
                                content: args.content,
                                commit_message: args.commit_message,
                                encoding: args.encoding || 'text'
                            };

                            if (args.author_email) fileData.author_email = args.author_email;
                            if (args.author_name) fileData.author_name = args.author_name;

                            const response = await gitlabRequest(endpoint, 'POST', fileData);

                            if (response.success) {
                                result = {
                                    success: true,
                                    file_path: args.file_path,
                                    branch: args.branch,
                                    message: `File "${args.file_path}" created successfully in branch "${args.branch}"`,
                                    web_url: `${GITLAB_URL}/${args.project_id}/-/blob/${args.branch}/${args.file_path}`
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'update_file':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/files/${encodeURIComponent(args.file_path)}`;
                            const fileData = {
                                branch: args.branch,
                                content: args.content,
                                commit_message: args.commit_message,
                                encoding: args.encoding || 'text'
                            };

                            if (args.author_email) fileData.author_email = args.author_email;
                            if (args.author_name) fileData.author_name = args.author_name;

                            const response = await gitlabRequest(endpoint, 'PUT', fileData);

                            if (response.success) {
                                result = {
                                    success: true,
                                    file_path: args.file_path,
                                    branch: args.branch,
                                    message: `File "${args.file_path}" updated successfully in branch "${args.branch}"`,
                                    web_url: `${GITLAB_URL}/${args.project_id}/-/blob/${args.branch}/${args.file_path}`
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'delete_file':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/files/${encodeURIComponent(args.file_path)}`;
                            const deleteData = {
                                branch: args.branch,
                                commit_message: args.commit_message
                            };

                            if (args.author_email) deleteData.author_email = args.author_email;
                            if (args.author_name) deleteData.author_name = args.author_name;

                            const response = await gitlabRequest(endpoint, 'DELETE', deleteData);

                            if (response.success) {
                                result = {
                                    success: true,
                                    file_path: args.file_path,
                                    branch: args.branch,
                                    message: `File "${args.file_path}" deleted successfully from branch "${args.branch}"`
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'get_file_content':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/files/${encodeURIComponent(args.file_path)}/raw`;
                            const queryParams = { ref: args.ref || 'main' };

                            const response = await gitlabRequest(endpoint, 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    project_id: args.project_id,
                                    file_path: args.file_path,
                                    ref: args.ref || 'main',
                                    content: response.data,
                                    size: response.data.length,
                                    encoding: 'utf8',
                                    web_url: `${GITLAB_URL}/${args.project_id}/-/blob/${args.ref || 'main'}/${args.file_path}`
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'create_merge_request':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/merge_requests`;
                            const mrData = {
                                source_branch: args.source_branch,
                                target_branch: args.target_branch || 'main',
                                title: args.title,
                                description: args.description || '',
                                remove_source_branch: args.remove_source_branch || false
                            };

                            if (args.assignee_id) mrData.assignee_id = args.assignee_id;

                            const response = await gitlabRequest(endpoint, 'POST', mrData);

                            if (response.success) {
                                const mr = response.data;
                                result = {
                                    success: true,
                                    merge_request: {
                                        id: mr.id,
                                        iid: mr.iid,
                                        title: mr.title,
                                        description: mr.description,
                                        source_branch: mr.source_branch,
                                        target_branch: mr.target_branch,
                                        author: mr.author.name,
                                        assignee: mr.assignee?.name || 'Unassigned',
                                        state: mr.state,
                                        web_url: mr.web_url,
                                        created_at: formatDate(mr.created_at)
                                    },
                                    message: `Merge request "${args.title}" created successfully`
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'list_merge_requests':
                        try {
                            let endpoint = args.project_id
                                ? `/projects/${encodeURIComponent(args.project_id)}/merge_requests`
                                : '/merge_requests';

                            const queryParams = {
                                state: args.state || 'opened',
                                per_page: args.per_page || 20
                            };

                            if (args.author_id) queryParams.author_id = args.author_id;
                            if (args.assignee_id) queryParams.assignee_id = args.assignee_id;

                            const response = await gitlabRequest(endpoint, 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    merge_requests: response.data.map(mr => ({
                                        id: mr.id,
                                        iid: mr.iid,
                                        title: mr.title,
                                        description: mr.description?.substring(0, 200) + (mr.description?.length > 200 ? '...' : ''),
                                        state: mr.state,
                                        author: mr.author.name,
                                        assignee: mr.assignee?.name || 'Unassigned',
                                        source_branch: mr.source_branch,
                                        target_branch: mr.target_branch,
                                        web_url: mr.web_url,
                                        created_at: formatDate(mr.created_at),
                                        updated_at: formatDate(mr.updated_at)
                                    })),
                                    total: response.data.length
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'get_merge_request':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/merge_requests/${args.merge_request_iid}`;
                            const response = await gitlabRequest(endpoint);

                            if (response.success) {
                                const mr = response.data;
                                result = {
                                    success: true,
                                    merge_request: {
                                        id: mr.id,
                                        iid: mr.iid,
                                        title: mr.title,
                                        description: mr.description,
                                        state: mr.state,
                                        author: mr.author.name,
                                        assignee: mr.assignee?.name || 'Unassigned',
                                        reviewers: mr.reviewers?.map(r => r.name) || [],
                                        source_branch: mr.source_branch,
                                        target_branch: mr.target_branch,
                                        web_url: mr.web_url,
                                        merge_status: mr.merge_status,
                                        pipeline_status: mr.pipeline?.status || 'N/A',
                                        changes_count: mr.changes_count,
                                        created_at: formatDate(mr.created_at),
                                        updated_at: formatDate(mr.updated_at)
                                    }
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'list_issues':
                        try {
                            let endpoint = args.project_id
                                ? `/projects/${encodeURIComponent(args.project_id)}/issues`
                                : '/issues';

                            const queryParams = {
                                state: args.state || 'opened',
                                per_page: args.per_page || 20
                            };

                            if (args.author_id) queryParams.author_id = args.author_id;
                            if (args.assignee_id) queryParams.assignee_id = args.assignee_id;
                            if (args.labels) queryParams.labels = args.labels;

                            const response = await gitlabRequest(endpoint, 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    issues: response.data.map(issue => ({
                                        id: issue.id,
                                        iid: issue.iid,
                                        title: issue.title,
                                        description: issue.description?.substring(0, 200) + (issue.description?.length > 200 ? '...' : ''),
                                        state: issue.state,
                                        author: issue.author.name,
                                        assignee: issue.assignee?.name || 'Unassigned',
                                        labels: issue.labels,
                                        web_url: issue.web_url,
                                        created_at: formatDate(issue.created_at),
                                        updated_at: formatDate(issue.updated_at)
                                    })),
                                    total: response.data.length
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'get_issue':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/issues/${args.issue_iid}`;
                            const response = await gitlabRequest(endpoint);

                            if (response.success) {
                                const issue = response.data;
                                result = {
                                    success: true,
                                    issue: {
                                        id: issue.id,
                                        iid: issue.iid,
                                        title: issue.title,
                                        description: issue.description,
                                        state: issue.state,
                                        author: issue.author.name,
                                        assignee: issue.assignee?.name || 'Unassigned',
                                        labels: issue.labels,
                                        web_url: issue.web_url,
                                        created_at: formatDate(issue.created_at),
                                        updated_at: formatDate(issue.updated_at),
                                        closed_at: issue.closed_at ? formatDate(issue.closed_at) : null
                                    }
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'create_issue':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/issues`;
                            const issueData = {
                                title: args.title,
                                description: args.description || ''
                            };

                            if (args.assignee_ids) issueData.assignee_ids = args.assignee_ids;
                            if (args.labels) issueData.labels = args.labels;

                            const response = await gitlabRequest(endpoint, 'POST', issueData);

                            if (response.success) {
                                const issue = response.data;
                                result = {
                                    success: true,
                                    issue: {
                                        id: issue.id,
                                        iid: issue.iid,
                                        title: issue.title,
                                        web_url: issue.web_url,
                                        created_at: formatDate(issue.created_at)
                                    },
                                    message: 'Issue created successfully'
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'list_branches':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/branches`;
                            const queryParams = { per_page: args.per_page || 20 };

                            if (args.search) queryParams.search = args.search;

                            const response = await gitlabRequest(endpoint, 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    branches: response.data.map(branch => ({
                                        name: branch.name,
                                        protected: branch.protected,
                                        merged: branch.merged,
                                        default: branch.default,
                                        last_commit: {
                                            id: branch.commit.id.substring(0, 8),
                                            message: branch.commit.message.split('\n')[0],
                                            author: branch.commit.author_name,
                                            date: formatDate(branch.commit.created_at)
                                        },
                                        web_url: branch.web_url
                                    })),
                                    total: response.data.length
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'list_commits':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/repository/commits`;
                            const queryParams = {
                                ref_name: args.ref_name || 'main',
                                per_page: args.per_page || 20
                            };

                            if (args.since) queryParams.since = args.since;
                            if (args.until) queryParams.until = args.until;
                            if (args.author) queryParams.author = args.author;

                            const response = await gitlabRequest(endpoint, 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    commits: response.data.map(commit => ({
                                        id: commit.id,
                                        short_id: commit.short_id,
                                        title: commit.title,
                                        message: commit.message,
                                        author: commit.author_name,
                                        author_email: commit.author_email,
                                        created_at: formatDate(commit.created_at),
                                        web_url: commit.web_url
                                    })),
                                    total: response.data.length,
                                    branch: args.ref_name || 'main'
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'get_pipeline_status':
                        try {
                            const endpoint = `/projects/${encodeURIComponent(args.project_id)}/pipelines`;
                            const queryParams = {
                                ref: args.ref || 'main',
                                per_page: args.per_page || 10
                            };

                            const response = await gitlabRequest(endpoint, 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    pipelines: response.data.map(pipeline => ({
                                        id: pipeline.id,
                                        status: pipeline.status,
                                        ref: pipeline.ref,
                                        sha: pipeline.sha.substring(0, 8),
                                        source: pipeline.source,
                                        created_at: formatDate(pipeline.created_at),
                                        updated_at: formatDate(pipeline.updated_at),
                                        web_url: pipeline.web_url
                                    })),
                                    total: response.data.length,
                                    latest_status: response.data[0]?.status || 'unknown'
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'get_user_activity':
                        try {
                            const userResponse = await gitlabRequest('/user');

                            if (userResponse.success) {
                                const user = userResponse.data;
                                result = {
                                    success: true,
                                    user: {
                                        id: user.id,
                                        username: user.username,
                                        name: user.name,
                                        email: user.email,
                                        avatar_url: user.avatar_url,
                                        created_at: formatDate(user.created_at),
                                        last_activity: formatDate(user.last_activity_on),
                                        web_url: user.web_url
                                    }
                                };
                            } else {
                                result = { success: false, error: userResponse.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    case 'search_code':
                        try {
                            const endpoint = '/search';
                            const queryParams = {
                                scope: 'blobs',
                                search: args.search,
                                per_page: args.per_page || 20
                            };

                            if (args.project_id) {
                                queryParams.project_id = args.project_id;
                            }

                            const response = await gitlabRequest(endpoint, 'GET', null, queryParams);

                            if (response.success) {
                                result = {
                                    success: true,
                                    results: response.data.map(item => ({
                                        filename: item.filename,
                                        path: item.path,
                                        project_id: item.project_id,
                                        ref: item.ref,
                                        data: item.data.substring(0, 300) + (item.data.length > 300 ? '...' : ''),
                                        web_url: `${GITLAB_URL}/${item.project_id}/-/blob/${item.ref}/${item.path}`
                                    })),
                                    total: response.data.length,
                                    search_query: args.search
                                };
                            } else {
                                result = { success: false, error: response.error };
                            }
                        } catch (error) {
                            result = { success: false, error: error.message };
                        }
                        break;

                    default:
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
                return res.json(jsonRpcResponse(null, {
                    code: -32601,
                    message: `Method '${method}' not found`
                }));
        }
    } catch (error) {
        console.error(`[GitLab MCP] Error:`, error);
        return res.json(jsonRpcResponse(null, {
            code: -32603,
            message: error.message
        }));
    }
});

// Health Check
app.get('/health', async (req, res) => {
    try {
        const response = await gitlabRequest('/user', 'GET', null, {});
        res.json({
            status: 'healthy',
            server: 'gitlab-mcp-server',
            version: '2.0.0',
            tools: tools.length,
            gitlab: {
                url: GITLAB_URL,
                connection: response.success ? 'connected' : 'failed',
                user: response.success ? response.data.username : null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            server: 'gitlab-mcp-server',
            version: '2.0.0',
            tools: tools.length,
            gitlab: {
                url: GITLAB_URL,
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
        server: 'gitlab-mcp-server',
        description: 'GitLab integration with Git operations for LibreChat',
        capabilities: { tools: true, resources: false, prompts: false },
        tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description
        })),
        gitlab: {
            url: GITLAB_URL,
            api_version: 'v4'
        }
    });
});

// Test Endpoint
app.get('/test', async (req, res) => {
    try {
        const userResponse = await gitlabRequest('/user');
        const projectsResponse = await gitlabRequest('/projects', 'GET', null, { per_page: 5 });

        res.json({
            test: 'passed',
            gitlab_connection: 'working',
            user: userResponse.success ? userResponse.data.username : 'failed',
            projects_count: projectsResponse.success ? projectsResponse.data.length : 'failed',
            tools: tools.length,
            new_git_features: [
                'create_branch',
                'commit_files',
                'create_file',
                'update_file',
                'delete_file',
                'get_file_content',
                'create_merge_request'
            ]
        });
    } catch (error) {
        res.status(500).json({
            test: 'failed',
            gitlab_connection: 'failed',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 8005;
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('  GitLab MCP Server v2.0 Started');
    console.log('==========================================');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Test: http://localhost:${PORT}/test`);
    console.log(`📋 Info: http://localhost:${PORT}/mcp`);
    console.log(`🦊 GitLab: ${GITLAB_URL}`);
    console.log(`🛠️  Tools: ${tools.length} available`);
    console.log(`📡 MCP Endpoint: /mcp`);
    console.log('');
    console.log('🆕 New Git Features:');
    console.log('   ✅ create_branch - Create new branches');
    console.log('   ✅ commit_files - Multi-file commits');
    console.log('   ✅ create_file - Create single files');
    console.log('   ✅ update_file - Update existing files');
    console.log('   ✅ delete_file - Delete files');
    console.log('   ✅ get_file_content - Read file content');
    console.log('   ✅ create_merge_request - Create MRs');
    console.log('==========================================');

    if (!GITLAB_TOKEN) {
        console.log('⚠️  WARNING: GITLAB_TOKEN not set!');
        console.log('   Set your GitLab Personal Access Token');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[GitLab MCP] Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[GitLab MCP] Server shutting down gracefully...');
    process.exit(0);
});