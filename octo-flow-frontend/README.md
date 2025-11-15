# Enterprise Architecture Modellierungs-Tool

Ein interaktives Tool zur Modellierung von Enterprise Architecture mit React und ReactFlow.

## Features

### Layer 0: Service Landscape View
- Übersicht aller Services/Microservices
- Drag & Drop zum Positionieren
- Verbindungen zwischen Services
- Export-Funktion

### Layer 1: Service Detail View
- **Entity Nodes**: Datenbankmodelle mit Feldern
- **API Endpoint Nodes**: HTTP-Endpunkte (GET, POST, PUT, DELETE, PATCH)
- **UI Component Nodes**: UI-Komponenten (Page, Component, Form, Modal)
- **Activity Nodes**: Prozessabläufe (Start, Action, Decision, End)

## Installation

```bash
npm install
```

## Entwicklung starten

```bash
npm run dev
```

Die Anwendung läuft dann auf http://localhost:3000

## Build für Produktion

```bash
npm run build
```

## Verwendung

1. **Service hinzufügen**: Klicke auf "Add Service" in der Landscape View
2. **Service öffnen**: Klicke auf einen Service-Node um zur Detail View zu gelangen
3. **Nodes hinzufügen**: Nutze die Toolbar-Buttons um verschiedene Node-Typen hinzuzufügen
4. **Verbindungen erstellen**: Ziehe von einem Handle eines Nodes zu einem anderen
5. **Eigenschaften bearbeiten**: Klicke auf einen Node um das Property Panel zu öffnen
6. **Filter verwenden**: Nutze den Filter-Button um Node-Typen ein-/auszublenden
7. **Export**: Exportiere dein Projekt als JSON-Datei

## Technologien

- React
- ReactFlow
- React Router
- Zustand (State Management)
- Tailwind CSS
- Lucide React (Icons)
- Vite (Build Tool)

## Persistierung

Das Projekt wird automatisch im LocalStorage gespeichert und beim nächsten Besuch wiederhergestellt.