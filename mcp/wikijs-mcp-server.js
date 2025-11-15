// wikijs-mcp-server.js
// Wiki.js MCP Server – strikt kompatibel zum Requarks GraphQL-Schema (pages.*)

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8008;

// === Konfiguration ===
const WIKIJS_URL = process.env.WIKIJS_URL || 'http://wikijs:3000';
const WIKIJS_API_KEY = process.env.WIKIJS_API_KEY || '';

app.use(cors());
app.use(express.json());

// === Helpers ===
function formatDate(v) {
    if (!v) return 'N/A';
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

async function gql(query, variables = {}) {
    try {
        const r = await axios.post(`${WIKIJS_URL}/graphql`, { query, variables }, {
            headers: { Authorization: `Bearer ${WIKIJS_API_KEY}`, 'Content-Type': 'application/json' },
            timeout: 15000,
        });
        if (r.data?.errors) throw new Error(JSON.stringify(r.data.errors));
        return { ok: true, data: r.data.data };
    } catch (e) {
        const msg = e.response?.data?.message || e.response?.data?.errors || e.message;
        return { ok: false, error: msg };
    }
}

// === Tool-Definitionen (LibreChat-kompatibel) ===
const tools = [
    {
        name: 'get_pages',
        description: 'Liste Seiten (limit, orderBy, orderByDirection, tags, locale, creatorId, authorId)',
        inputSchema: {
            type: 'object',
            properties: {
                limit: { type: 'number', default: 50, description: 'Max. Anzahl (default 50)' },
                orderBy: { type: 'string', description: 'CREATED|ID|PATH|TITLE|UPDATED' },
                orderByDirection: { type: 'string', description: 'ASC|DESC' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Filter nach Tags' },
                locale: { type: 'string', description: 'z.B. "en", "de"' },
                creatorId: { type: 'number' },
                authorId: { type: 'number' },
            },
            required: [],
        },
    },
    {
        name: 'get_page',
        description: 'Hole eine Seite per id ODER per (path + locale)',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: 'Seiten-ID' },
                path: { type: 'string', description: 'Pfad, z.B. "/docs/intro" oder "home"' },
                locale: { type: 'string', description: 'Pflicht bei path, z.B. "en", "de"' },
            },
            required: [], // Runtime-Validierung
        },
    },
    {
        name: 'create_page',
        description: 'Erstelle eine neue Seite (GraphQL: pages.create)',
        inputSchema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                path: { type: 'string' },
                content: { type: 'string' },
                description: { type: 'string' },
                editor: { type: 'string', default: 'markdown', description: 'z.B. "markdown"' },
                isPublished: { type: 'boolean', default: true },
                isPrivate: { type: 'boolean', default: false },
                locale: { type: 'string', default: 'en' },
                publishStartDate: { type: 'string', description: 'ISO Date (optional)' },
                publishEndDate: { type: 'string', description: 'ISO Date (optional)' },
                scriptCss: { type: 'string' },
                scriptJs: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' }, default: [] },
            },
            // laut Schema zwingend:
            required: ['title', 'path', 'content', 'description', 'editor', 'isPublished', 'isPrivate', 'locale', 'tags'],
        },
    },
    {
        name: 'update_page',
        description: 'Aktualisiere Seite (GraphQL: pages.update)',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                title: { type: 'string' },
                path: { type: 'string' },
                content: { type: 'string' },
                description: { type: 'string' },
                editor: { type: 'string', description: 'z.B. "markdown"' },
                isPublished: { type: 'boolean' },
                isPrivate: { type: 'boolean' },
                locale: { type: 'string' },
                publishStartDate: { type: 'string' },
                publishEndDate: { type: 'string' },
                scriptCss: { type: 'string' },
                scriptJs: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['id'],
        },
    },
    {
        name: 'delete_page',
        description: 'Lösche Seite (GraphQL: pages.delete)',
        inputSchema: {
            type: 'object',
            properties: { id: { type: 'number' } },
            required: ['id'],
        },
    },
    {
        name: 'search_pages',
        description: 'Suche Seiten (GraphQL: pages.search)',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string' },
                path: { type: 'string', description: 'optional: Pfadpräfix' },
                locale: { type: 'string', description: 'optional' },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_tree',
        description: 'Seitenbaum (GraphQL: pages.tree) – benötigt mode und locale',
        inputSchema: {
            type: 'object',
            properties: {
                mode: { type: 'string', description: 'FOLDERS|PAGES|ALL' },
                locale: { type: 'string', description: 'z.B. "en", "de"' },
                path: { type: 'string', description: 'optional: Pfadwurzel' },
                parent: { type: 'number', description: 'optional: Parent-ID' },
                includeAncestors: { type: 'boolean', description: 'optional' },
            },
            required: ['mode', 'locale'],
        },
    },
];

// === Tool-Implementierungen ===
async function t_get_pages(args = {}) {
    const { limit = 50, orderBy, orderByDirection, tags, locale, creatorId, authorId } = args;
    const q = `
    query($limit:Int,$orderBy:PageOrderBy,$orderByDirection:PageOrderByDirection,$tags:[String!],$locale:String,$creatorId:Int,$authorId:Int){
      pages {
        list(limit:$limit, orderBy:$orderBy, orderByDirection:$orderByDirection, tags:$tags, locale:$locale, creatorId:$creatorId, authorId:$authorId) {
          id path locale title description contentType isPublished isPrivate privateNS createdAt updatedAt tags
        }
      }
    }`;
    const r = await gql(q, { limit, orderBy, orderByDirection, tags, locale, creatorId, authorId });
    if (!r.ok) return { success: false, error: r.error };
    const rows = r.data?.pages?.list || [];
    return {
        success: true,
        total: rows.length,
        pages: rows.map(p => ({
            id: p.id, path: p.path, locale: p.locale, title: p.title, description: p.description,
            contentType: p.contentType, isPublished: p.isPublished, isPrivate: p.isPrivate,
            privateNS: p.privateNS, createdAt: formatDate(p.createdAt), updatedAt: formatDate(p.updatedAt),
            tags: p.tags || [],
        })),
    };
}

async function t_get_page(args = {}) {
    const { id, path, locale } = args;
    if (typeof id !== 'number' && !(path && locale)) {
        return { success: false, error: 'Bitte id ODER (path UND locale) angeben.' };
    }

    if (typeof id === 'number') {
        const q = `
      query($id:Int!){
        pages { single(id:$id){
          id path hash title description isPrivate isPublished privateNS publishStartDate publishEndDate
          tags { id tag title createdAt updatedAt }
          content render toc contentType createdAt updatedAt editor locale scriptCss scriptJs
          authorId authorName authorEmail creatorId creatorName creatorEmail
        } }
      }`;
        const r = await gql(q, { id });
        if (!r.ok) return { success: false, error: r.error };
        const p = r.data?.pages?.single;
        if (!p) return { success: false, error: 'Seite nicht gefunden' };
        return serializePage(p);
    }

    // path + locale
    const q = `
    query($path:String!,$locale:String!){
      pages { singleByPath(path:$path, locale:$locale){
        id path hash title description isPrivate isPublished privateNS publishStartDate publishEndDate
        tags { id tag title createdAt updatedAt }
        content render toc contentType createdAt updatedAt editor locale scriptCss scriptJs
        authorId authorName authorEmail creatorId creatorName creatorEmail
      } }
    }`;
    const r = await gql(q, { path, locale });
    if (!r.ok) return { success: false, error: r.error };
    const p = r.data?.pages?.singleByPath;
    if (!p) return { success: false, error: 'Seite nicht gefunden' };
    return serializePage(p);
}

function serializePage(p) {
    return {
        success: true,
        page: {
            id: p.id, path: p.path, hash: p.hash, title: p.title, description: p.description,
            isPrivate: p.isPrivate, isPublished: p.isPublished, privateNS: p.privateNS,
            publishStartDate: p.publishStartDate, publishEndDate: p.publishEndDate,
            tags: (p.tags || []).map(t => t.tag),
            content: p.content, render: p.render, toc: p.toc, contentType: p.contentType,
            createdAt: formatDate(p.createdAt), updatedAt: formatDate(p.updatedAt),
            editor: p.editor, locale: p.locale, scriptCss: p.scriptCss, scriptJs: p.scriptJs,
            author: { id: p.authorId, name: p.authorName, email: p.authorEmail },
            creator: { id: p.creatorId, name: p.creatorName, email: p.creatorEmail },
        },
    };
}

async function t_create_page(args = {}) {
    const {
        title, path, content, description,
        editor = 'markdown', isPublished = true, isPrivate = false, locale = 'en',
        publishStartDate, publishEndDate, scriptCss, scriptJs, tags = [],
    } = args;

    const q = `
    mutation($title:String!,$path:String!,$content:String!,$description:String!,$editor:String!,$isPublished:Boolean!,$isPrivate:Boolean!,$locale:String!,$publishStartDate:Date,$publishEndDate:Date,$scriptCss:String,$scriptJs:String,$tags:[String!]!){
      pages {
        create(
          title:$title, path:$path, content:$content, description:$description,
          editor:$editor, isPublished:$isPublished, isPrivate:$isPrivate, locale:$locale,
          publishStartDate:$publishStartDate, publishEndDate:$publishEndDate,
          scriptCss:$scriptCss, scriptJs:$scriptJs, tags:$tags
        ) {
          responseResult { succeeded errorCode slug message }
          page { id path title }
        }
      }
    }`;
    const r = await gql(q, {
        title, path, content, description, editor, isPublished, isPrivate, locale,
        publishStartDate, publishEndDate, scriptCss, scriptJs, tags,
    });
    if (!r.ok) return { success: false, error: r.error };
    const rr = r.data?.pages?.create?.responseResult;
    return rr?.succeeded
        ? { success: true, message: rr.message || 'Seite erstellt', page: r.data.pages.create.page }
        : { success: false, error: rr?.message || `Fehler: ${rr?.errorCode || 'unknown'}` };
}

async function t_update_page(args = {}) {
    const {
        id, title, path, content, description, editor,
        isPublished, isPrivate, locale, publishStartDate, publishEndDate, scriptCss, scriptJs, tags,
    } = args;

    const q = `
    mutation($id:Int!,$title:String,$path:String,$content:String,$description:String,$editor:String,$isPublished:Boolean,$isPrivate:Boolean,$locale:String,$publishStartDate:Date,$publishEndDate:Date,$scriptCss:String,$scriptJs:String,$tags:[String]){
      pages {
        update(
          id:$id, title:$title, path:$path, content:$content, description:$description, editor:$editor,
          isPublished:$isPublished, isPrivate:$isPrivate, locale:$locale,
          publishStartDate:$publishStartDate, publishEndDate:$publishEndDate,
          scriptCss:$scriptCss, scriptJs:$scriptJs, tags:$tags
        ) {
          responseResult { succeeded errorCode slug message }
        }
      }
    }`;
    const r = await gql(q, {
        id, title, path, content, description, editor, isPublished, isPrivate,
        locale, publishStartDate, publishEndDate, scriptCss, scriptJs, tags,
    });
    if (!r.ok) return { success: false, error: r.error };
    const rr = r.data?.pages?.update?.responseResult;
    return rr?.succeeded
        ? { success: true, message: rr.message || 'Seite aktualisiert', id }
        : { success: false, error: rr?.message || `Fehler: ${rr?.errorCode || 'unknown'}` };
}

async function t_delete_page({ id } = {}) {
    const q = `mutation($id:Int!){ pages { delete(id:$id){ responseResult { succeeded errorCode slug message } } } }`;
    const r = await gql(q, { id });
    if (!r.ok) return { success: false, error: r.error };
    const rr = r.data?.pages?.delete?.responseResult;
    return rr?.succeeded
        ? { success: true, message: rr.message || 'Seite gelöscht', id }
        : { success: false, error: rr?.message || `Fehler: ${rr?.errorCode || 'unknown'}` };
}

async function t_search_pages(args = {}) {
    const { query, path, locale } = args;
    const q = `
    query($query:String!,$path:String,$locale:String){
      pages { search(query:$query, path:$path, locale:$locale){
        totalHits results { id title description path locale } suggestions
      } }
    }`;
    const r = await gql(q, { query, path, locale });
    if (!r.ok) return { success: false, error: r.error };
    const s = r.data?.pages?.search;
    return {
        success: true,
        total: s?.totalHits ?? 0,
        results: (s?.results || []).map(x => ({
            id: x.id, title: x.title, description: x.description, path: x.path, locale: x.locale,
        })),
        suggestions: s?.suggestions || [],
    };
}

async function t_get_tree(args = {}) {
    const { mode, locale, path, parent, includeAncestors } = args;
    const q = `
    query($mode:PageTreeMode!,$locale:String!,$path:String,$parent:Int,$includeAncestors:Boolean){
      pages { tree(mode:$mode, locale:$locale, path:$path, parent:$parent, includeAncestors:$includeAncestors){
        id path depth title isPrivate isFolder privateNS parent pageId locale
      } }
    }`;
    const r = await gql(q, { mode, locale, path, parent, includeAncestors });
    if (!r.ok) return { success: false, error: r.error };
    return { success: true, tree: r.data?.pages?.tree || [] };
}

// === Alias-Map (optional rückwärtskompatibel) ===
const NAME_ALIASES = {
    'wikijs:get_pages': 'get_pages',
    'wikijs:get_page': 'get_page',
    'wikijs:create_page': 'create_page',
    'wikijs:update_page': 'update_page',
    'wikijs:delete_page': 'delete_page',
    'wikijs:search_pages': 'search_pages',
    'wikijs:get_tree': 'get_tree',
};

// === MCP JSON-RPC (/mcp) ===
app.post('/mcp', async (req, res) => {
    const { method, params, id } = req.body;

    const reply = (result, error = null) => {
        const out = { jsonrpc: '2.0' };
        if (id !== undefined) out.id = id;
        if (error) out.error = error; else out.result = result;
        return out;
    };

    try {
        switch (method) {
            case 'initialize':
                return res.json(reply({
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {}, resources: {}, prompts: {} },
                    serverInfo: {
                        name: 'wikijs-mcp-server',
                        version: '3.0.0',
                        description: 'Wiki.js integration via GraphQL (strict API schema)',
                    },
                }));

            case 'ping':
            case 'notifications/initialized':
                return res.json(reply({}));

            case 'tools/list':
                return res.json(reply({ tools }));

            case 'tools/call': {
                const { name: rawName, arguments: args } = params || {};
                const name = NAME_ALIASES[rawName] || rawName;

                if (!WIKIJS_API_KEY) {
                    return res.json(reply(null, { code: -32001, message: 'WIKIJS_API_KEY fehlt.' }));
                }

                let result;
                switch (name) {
                    case 'get_pages': result = await t_get_pages(args); break;
                    case 'get_page': result = await t_get_page(args); break;
                    case 'create_page': result = await t_create_page(args); break;
                    case 'update_page': result = await t_update_page(args); break;
                    case 'delete_page': result = await t_delete_page(args); break;
                    case 'search_pages': result = await t_search_pages(args); break;
                    case 'get_tree': result = await t_get_tree(args); break;
                    default:
                        return res.json(reply(null, { code: -32601, message: `Tool '${name}' nicht gefunden` }));
                }
                return res.json(reply({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }));
            }

            case 'resources/list':
                return res.json(reply({ resources: [] }));
            case 'prompts/list':
                return res.json(reply({ prompts: [] }));

            default:
                return res.json(reply(null, { code: -32601, message: `Method '${method}' nicht gefunden` }));
        }
    } catch (e) {
        return res.json(reply(null, { code: -32603, message: e.message }));
    }
});

// === Health / Info ===
app.get('/health', async (_req, res) => {
    const ping = await gql(`query { pages { list(limit:1){ id } } }`);
    res.json({
        status: ping.ok ? 'healthy' : 'degraded',
        service: 'wikijs-mcp-server',
        version: '3.0.0',
        wikijs_url: WIKIJS_URL,
        api_key_present: !!WIKIJS_API_KEY,
        timestamp: new Date().toISOString(),
        connectivity: ping.ok ? 'ok' : `error: ${ping.error}`,
    });
});

app.get('/mcp', (_req, res) => {
    res.json({
        protocol: 'mcp',
        version: '2024-11-05',
        server: 'wikijs-mcp-server',
        description: 'Wiki.js integration via GraphQL (strict API schema)',
        capabilities: { tools: true, resources: false, prompts: false },
        tools: tools.map(t => ({ name: t.name, description: t.description })),
        wikijs: { url: WIKIJS_URL, api: 'graphql' },
    });
});

// Start
app.listen(PORT, () => {
    console.log('==========================================');
    console.log('  Wiki.js MCP Server v3.0.0 Started');
    console.log('==========================================');
    console.log(`🚀 Server:   http://localhost:${PORT}`);
    console.log(`📚 Wiki.js:  ${WIKIJS_URL}`);
    console.log(`🔑 API Key:  ${WIKIJS_API_KEY ? 'SET' : 'MISSING!'}`);
    console.log(`🏥 Health:   http://localhost:${PORT}/health`);
    console.log(`📋 Info:     http://localhost:${PORT}/mcp`);
    console.log(`📡 MCP POST: /mcp`);
});
