<div align="center">

<img src="https://github.com/shaishab316/wsgate/blob/main/packages/ui/src/assets/icon.png?raw=true" alt="wsgate logo" width="120" />

# @wsgate/express

**Interactive Swagger-like UI for Express.js Socket.IO Events**

[![npm version](https://img.shields.io/npm/v/@wsgate/express?color=crimson&style=flat-square)](https://www.npmjs.com/package/@wsgate/express)
[![npm downloads](https://img.shields.io/npm/dm/@wsgate/express?style=flat-square)](https://www.npmjs.com/package/@wsgate/express)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

</div>

<br/>

`@wsgate/express` brings the wsgate interactive UI to Express.js + Socket.IO apps — same UI as `@wsgate/nest`, no NestJS required.

---

## Installation

```bash
pnpm add @wsgate/express
```

## Setup

```typescript
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { wsgate } from '@wsgate/express';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(
  '/wsgate',
  wsgate({
    title: 'My App',
    events: [
      {
        event: 'message:send',
        description: 'Send a message to a room.',
        payload: { room: 'string', text: 'string' },
        response: 'message:receive',
        type: 'emit',
        namespace: '/',
      },
      {
        event: 'message:receive',
        description: 'Broadcasted message from a room.',
        payload: { username: 'string', text: 'string' },
        type: 'subscribe',
        namespace: '/',
      },
    ],
  }),
);

httpServer.listen(3000);
// → http://localhost:3000/wsgate
```

## Options

### `WsgateOptions`

| Option     | Type           | Default    | Description                  |
| ---------- | -------------- | ---------- | ---------------------------- |
| `title`    | `string`       | `'WsGate'` | Title shown in the UI header |
| `disabled` | `boolean`      | `false`    | Disable the UI entirely      |
| `events`   | `WsEventDoc[]` | —          | Array of documented events   |

### `WsEventDoc`

| Field         | Type                     | Required | Description                            |
| ------------- | ------------------------ | -------- | -------------------------------------- |
| `event`       | `string`                 | ✅       | Socket.IO event name                   |
| `type`        | `'emit' \| 'subscribe'`  | ❌       | Direction of the event                 |
| `description` | `string`                 | ❌       | Shown in the UI                        |
| `payload`     | `Record<string, string>` | ❌       | Field names → type labels              |
| `response`    | `string`                 | ❌       | Response event name (`emit` only)      |
| `namespace`   | `string`                 | ❌       | Socket.IO namespace, defaults to `'/'` |
| `handlerName` | `string`                 | ❌       | Handler function name                  |
| `gatewayName` | `string`                 | ❌       | Class or module name                   |

## Disable in production

```typescript
app.use(
  '/wsgate',
  wsgate({
    disabled: process.env.NODE_ENV === 'production',
    events: [],
  }),
);
```

---

## Contributing

See [CONTRIBUTING.md](/CONTRIBUTING.md) for guidelines.

Open an issue before a large PR.

## License

See [LICENSE](/LICENSE) for details.

---

<div align="center">
  <b>If this saved you from writing another throwaway test client, drop a ⭐</b>
</div>
