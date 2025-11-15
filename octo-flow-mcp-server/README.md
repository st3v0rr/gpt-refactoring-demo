# EA Tool MCP Server

MCP (Model Context Protocol) Server für das Enterprise Architecture Tool. Ermöglicht es KI-Assistenten, Artefakte im Backend anzulegen und zu verwalten.

## Features

- ✅ Services erstellen und verwalten
- ✅ Entities mit Feldern anlegen
- ✅ API Endpoints mit Request/Response Schemas erstellen
- ✅ UI Components hinzufügen
- ✅ Activity Container mit kompletten Aktivitätsdiagrammen erstellen
- ✅ Verbindungen zwischen Nodes erstellen
- ✅ **Bulk Operations** - Mehrere Entities, Endpoints, UI Components, Activities oder Connections gleichzeitig anlegen

## Installation

```bash
cd mcp-server
npm install
```

## Verfügbare Tools

### 1. `get_project`
Gibt das komplette Projekt mit allen Services zurück.

### 2. `create_service`
Erstellt einen neuen Service.
- **Parameter**: `name` (required), `description` (optional)

### 3. `create_entity`
Erstellt eine neue Entity in einem Service.
- **Parameter**:
  - `serviceId` (required)
  - `name` (required)
  - `fields` (optional) - Array von {name, type, required}
  - `position` (optional) - {x, y}

### 4. `create_entities_bulk` ⚡
Erstellt mehrere Entities gleichzeitig.
- **Parameter**:
  - `serviceId` (required)
  - `entities` (required) - Array von Entity-Objekten

**Beispiel**:
```json
{
  "serviceId": "service-123",
  "entities": [
    {
      "name": "User",
      "fields": [
        {"name": "id", "type": "UUID", "required": true},
        {"name": "email", "type": "String", "required": true},
        {"name": "name", "type": "String", "required": false}
      ]
    },
    {
      "name": "Product",
      "fields": [
        {"name": "id", "type": "UUID", "required": true},
        {"name": "title", "type": "String", "required": true},
        {"name": "price", "type": "Decimal", "required": true}
      ]
    }
  ]
}
```

### 5. `create_api_endpoint`
Erstellt einen neuen API Endpoint.
- **Parameter**:
  - `serviceId` (required)
  - `method` (required) - GET, POST, PUT, DELETE, PATCH
  - `path` (required)
  - `summary` (optional)
  - `requestFields` (optional)
  - `responseFields` (optional)
  - `position` (optional)

### 6. `create_api_endpoints_bulk` ⚡
Erstellt mehrere API Endpoints gleichzeitig.
- **Parameter**:
  - `serviceId` (required)
  - `endpoints` (required) - Array von Endpoint-Objekten

**Beispiel**:
```json
{
  "serviceId": "service-123",
  "endpoints": [
    {
      "method": "POST",
      "path": "/api/users",
      "summary": "Create new user",
      "requestFields": [
        {"name": "email", "type": "string", "required": true},
        {"name": "password", "type": "string", "required": true}
      ],
      "responseFields": [
        {"name": "id", "type": "string", "required": true},
        {"name": "email", "type": "string", "required": true}
      ]
    },
    {
      "method": "GET",
      "path": "/api/users/:id",
      "summary": "Get user by ID",
      "responseFields": [
        {"name": "id", "type": "string", "required": true},
        {"name": "email", "type": "string", "required": true},
        {"name": "name", "type": "string", "required": false}
      ]
    }
  ]
}
```

### 7. `create_ui_component`
Erstellt eine neue UI Component.
- **Parameter**:
  - `serviceId` (required)
  - `name` (required)
  - `componentType` (required) - page, modal, form, list
  - `description` (optional)
  - `position` (optional)

### 8. `create_ui_components_bulk` ⚡
Erstellt mehrere UI Components gleichzeitig.
- **Parameter**:
  - `serviceId` (required)
  - `components` (required) - Array von Component-Objekten

**Beispiel**:
```json
{
  "serviceId": "service-123",
  "components": [
    {
      "name": "UserListPage",
      "componentType": "page",
      "description": "Displays list of users"
    },
    {
      "name": "UserDetailModal",
      "componentType": "modal",
      "description": "Modal for user details"
    },
    {
      "name": "UserForm",
      "componentType": "form",
      "description": "Form for creating/editing users"
    }
  ]
}
```

### 9. `create_connection`
Erstellt eine Verbindung zwischen zwei Nodes.
- **Parameter**:
  - `serviceId` (required)
  - `sourceNodeId` (required)
  - `targetNodeId` (required)
  - `label` (optional)
  - `description` (optional)

### 10. `create_connections_bulk` ⚡
Erstellt mehrere Verbindungen gleichzeitig.
- **Parameter**:
  - `serviceId` (required)
  - `connections` (required) - Array von Connection-Objekten

**Beispiel**:
```json
{
  "serviceId": "service-123",
  "connections": [
    {
      "sourceNodeId": "node-1",
      "targetNodeId": "node-2",
      "label": "uses",
      "description": "API calls entity"
    },
    {
      "sourceNodeId": "node-3",
      "targetNodeId": "node-1",
      "label": "calls",
      "description": "UI calls API"
    }
  ]
}
```

### 11. `list_services`
Listet alle Services im Projekt auf.

### 12. `get_service`
Gibt Details eines spezifischen Service zurück.
- **Parameter**: `serviceId` (required)

### 13. `create_activity_container` ⚡
Erstellt einen Activity Container mit kompletten Aktivitätsdiagramm.
- **Parameter**:
  - `serviceId` (required)
  - `name` (required)
  - `description` (optional)
  - `activityNodes` (required) - Array von Activity Nodes
  - `activityEdges` (optional) - Array von Verbindungen
  - `position` (optional)

**Beispiel**:
```json
{
  "serviceId": "service-123",
  "name": "User Login Flow",
  "description": "Complete user authentication process",
  "activityNodes": [
    {
      "type": "activity-start",
      "label": "Start Login",
      "position": {"x": 100, "y": 100}
    },
    {
      "type": "activity-action",
      "label": "Validate Credentials",
      "description": "Check username and password",
      "actionType": "validation",
      "position": {"x": 100, "y": 200}
    },
    {
      "type": "activity-decision",
      "label": "Valid?",
      "condition": "credentials.isValid === true",
      "position": {"x": 100, "y": 300}
    },
    {
      "type": "activity-action",
      "label": "Create Session",
      "actionType": "api-call",
      "position": {"x": 100, "y": 400}
    },
    {
      "type": "activity-end",
      "label": "Login Complete",
      "position": {"x": 100, "y": 500}
    }
  ],
  "activityEdges": [
    {"sourceIndex": 0, "targetIndex": 1, "label": ""},
    {"sourceIndex": 1, "targetIndex": 2, "label": ""},
    {"sourceIndex": 2, "targetIndex": 3, "label": "yes", "description": "Credentials are valid"},
    {"sourceIndex": 3, "targetIndex": 4, "label": ""}
  ]
}
```

### 14. `create_activity_containers_bulk` ⚡
Erstellt mehrere Activity Container gleichzeitig.
- **Parameter**:
  - `serviceId` (required)
  - `activities` (required) - Array von Activity Container Objekten

**Beispiel**:
```json
{
  "serviceId": "service-123",
  "activities": [
    {
      "name": "User Registration",
      "activityNodes": [
        {"type": "activity-start", "label": "Start"},
        {"type": "activity-action", "label": "Validate Input"},
        {"type": "activity-action", "label": "Create User"},
        {"type": "activity-end", "label": "End"}
      ],
      "activityEdges": [
        {"sourceIndex": 0, "targetIndex": 1},
        {"sourceIndex": 1, "targetIndex": 2},
        {"sourceIndex": 2, "targetIndex": 3}
      ]
    },
    {
      "name": "Password Reset",
      "activityNodes": [
        {"type": "activity-start", "label": "Start"},
        {"type": "activity-action", "label": "Send Email"},
        {"type": "activity-action", "label": "Verify Token"},
        {"type": "activity-action", "label": "Update Password"},
        {"type": "activity-end", "label": "End"}
      ],
      "activityEdges": [
        {"sourceIndex": 0, "targetIndex": 1},
        {"sourceIndex": 1, "targetIndex": 2},
        {"sourceIndex": 2, "targetIndex": 3},
        {"sourceIndex": 3, "targetIndex": 4}
      ]
    }
  ]
}
```

## Verwendung mit Claude Desktop

1. MCP Server in der Claude Desktop Config registrieren:

```json
{
  "mcpServers": {
    "ea-tool": {
      "command": "node",
      "args": ["/Users/thomaskreibich/workspace_ai/prototype/mcp-server/index.js"],
      "env": {
        "EA_BACKEND_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

2. Backend Server starten:
```bash
cd ../server
npm start
```

3. Claude Desktop neu starten

4. Beispiel-Prompts:
   - "Erstelle einen Service namens 'User Management'"
   - "Lege 5 Entities an: User, Role, Permission, UserRole, RolePermission"
   - "Erstelle alle CRUD Endpoints für die User Entity"
   - "Erstelle 5 UI Components: UserListPage, UserDetailModal, UserForm, UserTable, UserCard"
   - "Verbinde alle UI Components mit den entsprechenden API Endpoints"
   - "Erstelle ein Aktivitätsdiagramm für den User Login Flow mit Start, Validate, Decision und End Nodes"
   - "Erstelle 3 Activity Container: User Registration, Login und Password Reset"
   - "Zeige mir alle Services im Projekt"

## Umgebungsvariablen

- `EA_BACKEND_URL` - URL des Backend Servers (default: `http://localhost:3001/api`)

## Entwicklung

Der MCP Server kommuniziert über stdio und verwendet das Model Context Protocol SDK.

## Troubleshooting

**Problem**: MCP Server kann Backend nicht erreichen
**Lösung**: Stelle sicher, dass der Backend Server auf Port 3001 läuft

**Problem**: Tools werden nicht in Claude Desktop angezeigt
**Lösung**: Claude Desktop neu starten nach Config-Änderungen