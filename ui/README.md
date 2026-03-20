<div align="center">
  <img src="./src/assets/icon.png" width="120px" alt="WSGate UI Logo">

# 🚀 WSGate UI

A Modern WebSocket Gateway Interface

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3+-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](/LICENSE)

</div>

## Overview

The **nestjs-wsgate** UI is a real-time WebSocket event explorer and debugger. It helps developers discover, compose, and test WebSocket events exposed by a NestJS application via the `@WsDoc()` decorator.

### Core Architecture

```mermaid
graph TD
    App["App.tsx<br/>Three-panel resizable layout<br/>Responsive horizontal/vertical"]

    Sidebar["Sidebar<br/>Events list<br/>Search/Filter<br/>Group by namespace"]
    EventPanel["EventPanel<br/>Compose events<br/>Edit JSON payload<br/>Generate code<br/>Emit to server<br/>History & presets"]
    EventLog["EventLog<br/>Live event stream<br/>Filter & search<br/>Export logs<br/>Pause/Resume<br/>Latency indicators"]

    WsgateStore["useWsgateStore<br/>Zustand<br/>UI state + events"]
    SocketStore["useSocketStore<br/>WebSocket lifecycle<br/>Connection mgmt"]

    Storage["Browser localStorage<br/>+ WebSocket connection"]

    App --> Sidebar
    App --> EventPanel
    App --> EventLog

    Sidebar --> WsgateStore
    EventPanel --> WsgateStore
    EventLog --> WsgateStore

    EventPanel --> SocketStore
    WsgateStore --> Storage
    SocketStore --> Storage

    style App fill:#3b82f6,stroke:#1e40af,color:#fff
    style Sidebar fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style EventPanel fill:#10b981,stroke:#047857,color:#fff
    style EventLog fill:#f59e0b,stroke:#d97706,color:#fff
    style WsgateStore fill:#6b7280,stroke:#374151,color:#fff
    style SocketStore fill:#6b7280,stroke:#374151,color:#fff
    style Storage fill:#4b5563,stroke:#1f2937,color:#fff
```

---

## State Management

### `useWsgateStore` (Zustand)

**Location**: `src/store/wsgate.store.ts`

Centralized state for UI configuration and event data.

#### Persisted State

- `url` — WebSocket server address (e.g., "ws://localhost:3000")
- `token` — Authentication token (Base64 encoded)
- `selectedEvent` — Currently selected event for composition
- `selectedNamespace` — Filtered namespace (e.g., "/chat", "/admin")
- `logs` — Array of emitted/received event log entries
- `acks` — ACK (acknowledgment) responses from server

#### Volatile State (session-only)

- `showExportMenu`, `showFakerVars`, `showCodeGen` — UI panel toggles
- `selectedEventIndex` — Current position in log

#### Actions

- `setUrl()`, `setToken()` — Connection config
- `setSelectedEvent()` — Switch active event for composition
- `addLog()` — Record an emitted or received event
- `addAck()` — Store server acknowledgment
- `clearLogs()` — Reset event history
- `updateLog()` — Modify log metadata (pinned, star, etc.)

**Usage Example:**

```tsx
const { selectedEvent, setSelectedEvent, logs, addLog } = useWsgateStore();

// Switch to an event
setSelectedEvent({ event: "user.created", type: "emit", ... });

// Record an emission
addLog({
  direction: "out",
  event: "user.created",
  payload: { id: 123 },
  timestamp: new Date().toISOString(),
});
```

### `useSocketStore` (WebSocket Lifecycle)

**Location**: `src/hooks/useSocket.ts`

Manages WebSocket connection, event listening, and server communication.

#### Status States

- `disconnected` — No connection
- `connecting` — Attempting connection
- `connected` — Active connection
- `error` — Connection failed

#### Actions

- `connect(url, token)` — Establish WebSocket connection
- `disconnect()` — Close connection gracefully
- `emit(namespace, event, payload)` — Send event to server

**Usage Example:**

```tsx
const { status, connect, disconnect, emit } = useSocketStore();

// Connect on component mount
useEffect(() => {
  if (token && url) {
    connect(url, token);
  }
}, [token, url]);

// Emit an event
const sendEvent = () => {
  emit(selectedEvent.namespace, selectedEvent.event, payload);
};
```

---

## Component Hierarchy

### `Navbar.tsx` — Connection & Settings

- Manages WebSocket URL and authentication token
- Connect/Disconnect button with status indicator
- Namespace picker for filtering events
- Theme toggle (light/dark)
- **Never re-renders** other panels—only updates stores

### `Sidebar.tsx` — Event Discovery

- Fetches all events from `/wsgate/events` endpoint after connection
- Groups events by namespace, then by gateway
- Provides search/filter by event name or description
- Clicking an event calls `setSelectedEvent()` in the store

### `EventPanel.tsx` — Event Composition

- **Monaco Editor** for JSON payload editing with:
  - Real-time JSON validation against event schema
  - Faker variable completions (`{{$randomInt}}`, `{{$randomFirstName}}`, etc.)
  - Syntax highlighting in dark VSCode theme
  - Auto-formatting (Ctrl+Shift+F)
- **Sub-panels**:
  - `CodeGenPanel` — Generate client code (9+ languages)
  - `HistoryDropdown` — Access saved payloads
  - `PresetsDropdown` — Save/load custom payload templates
  - `FakerVarsPanel` — Browse available faker variables
  - `MultiEmitPanel` — Batch emit with delay/repeat
- Emit button triggers `useSocketStore.emit()`
- ACK responses displayed in collapsible `AckPanel`

### `EventLog.tsx` — Live Event Stream

- Displays all emitted and received events in real-time
- Each log entry is expandable (`LogEntry.tsx`)
- Interactive features:
  - **Pause/Resume** — Freeze log to inspect old events
  - **Filter** — By direction (emit/receive), event type, namespace
  - **Search** — Full-text search across event names
  - **Pin/Star** — Highlight important events
  - **Export** — Download logs as JSON, CSV, or other formats
  - **Latency indicator** — RTT from emit to ACK/receive

---

## Data Flow

### 1. Event Discovery

```
User clicks "Connect"
    ↓
Navbar: connect(url, token)
    ↓
useSocketStore: Establish WebSocket
    ↓
Sidebar: Fetch /wsgate/events
    ↓
Parse events, group by namespace
    ↓
Render event tree
```

### 2. Compose & Emit

```
User selects event from Sidebar
    ↓
setSelectedEvent() → useWsgateStore
    ↓
EventPanel: Load event schema
    ↓
User edits JSON in Monaco
    ↓
User clicks "Emit"
    ↓
useSocketStore.emit(namespace, event, payload)
    ↓
WebSocket.send()
    ↓
addLog({ direction: "out", ... })
    ↓
EventLog: Display emission
    ↓
Server processes, sends back ACK or event
    ↓
addLog() + addAck()
    ↓
EventLog: Display response + latency
```

### 3. Faker Variable Resolution

```
User types {{ in editor
    ↓
Monaco: Trigger completion provider
    ↓
buildFakerCompletions() returns suggestions
    ↓
User selects {{$randomFirstName}}
    ↓
User clicks "Emit"
    ↓
resolveFakerVars(jsonStr) replaces all {{$var}} → random values
    ↓
emit({ name: "Alice", ... })
```

---

## Key Libraries & Patterns

### React Patterns

- **Hooks**: `useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`
- **No prop drilling**: All state via Zustand stores
- **Responsive design**: Media queries for mobile/tablet/desktop

### UI Library

- **Tailwind CSS** — Utility-first styling with light/dark themes
- **Lucide React** — Icon library (40+ icons used)
- **React Resizable Panels** — Draggable panel splitters
- **Monaco Editor** — JSON editing with language features

### State Management

- **Zustand** — Lightweight store with localStorage persistence
- **React Query** (if needed) — Can be added for server data fetching

### Data Validation & Code Gen

- **JSON Schema** — Monaco validates payloads against event schema
- **@types/node** — TypeScript support

---

## File Organization

```
src/
├── App.tsx                     # Root layout (3-panel resizable)
├── main.tsx                    # React 18 entry point
│
├── components/
│   ├── Navbar.tsx              # Top nav: URL, token, namespace, theme
│   ├── Sidebar.tsx             # Event list + search/filter
│   ├── EventPanel.tsx          # Main event editor + composer
│   ├── EventLog.tsx            # Live event stream
│   │
│   ├── sub-components/         # Reusable UI blocks
│   │   ├── CodeGenPanel.tsx
│   │   ├── HistoryDropdown.tsx
│   │   ├── PresetsDropdown.tsx
│   │   ├── FakerVarsPanel.tsx
│   │   ├── MultiEmitPanel.tsx
│   │   ├── AckPanel.tsx
│   │   ├── LogEntry.tsx
│   │   ├── EventRow.tsx
│   │   ├── CopyButton.tsx      # Icon button + clipboard
│   │   ├── IconBtn.tsx         # Reusable icon button
│   │   ├── PayloadSection.tsx  # Labeled JSON viewer
│   │   ├── JsonViewer.tsx      # Syntax-highlighted JSON
│   │   └── Config.tsx          # Constants: colors, icons, configs
│   │
│   ├── ui/                     # Headless UI components
│   │   ├── button.tsx
│   │   └── badge.tsx
│   │
│   └── shimmer/                # Loading skeletons
│       ├── EditorShimmer.tsx
│       └── ...
│
├── hooks/
│   └── useSocket.ts            # WebSocket connection lifecycle
│   └── useTheme.ts             # Light/dark theme management
│
├── store/
│   └── wsgate.store.ts         # Zustand store (events, logs, config)
│
├── lib/
│   ├── utils.ts                # 15+ utility functions
│   ├── faker.ts                # Random data generation
│   └── utils/
│       └── debounce.ts         # Debounce helper
│
├── types/
│   ├── ws-event.ts             # WsEvent, SelectedEvent interfaces
│   └── log.ts                  # LogEntry type
│
└── assets/
    └── icon.png                # App logo
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Open an issue before a large PR.

## License

See [LICENSE](/LICENSE) for details.

---

<div align="center">
  <b>If this saved you from writing another throwaway test client, drop a ⭐</b>
</div>
