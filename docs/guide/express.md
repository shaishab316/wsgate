# Express.js

`@wsgate/express` is a middleware for Express.js + Socket.IO apps — same UI as `@wsgate/nest`, but without NestJS.

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
        description: 'Send a message to the chat.',
        payload: { text: 'string', username: 'string' },
        response: 'message:receive',
        type: 'emit',
        namespace: '/',
      },
      {
        event: 'message:receive',
        description: 'Receive a message from the chat.',
        payload: { text: 'string', username: 'string' },
        type: 'subscribe',
        namespace: '/',
      },
    ],
  }),
);

httpServer.listen(3000, () => {
  console.log('→ http://localhost:3000/wsgate');
});
```

## Options

| Option     | Type           | Default    | Description                  |
| ---------- | -------------- | ---------- | ---------------------------- |
| `title`    | `string`       | `'WsGate'` | Title shown in the UI header |
| `disabled` | `boolean`      | `false`    | Disable the UI entirely      |
| `events`   | `WsEventDoc[]` | `[]`       | Array of documented events   |

## `WsEventDoc`

| Field         | Type                     | Required | Description                            |
| ------------- | ------------------------ | -------- | -------------------------------------- |
| `event`       | `string`                 | ✅       | Socket.IO event name                   |
| `type`        | `'emit' \| 'subscribe'`  | ❌       | Direction of the event                 |
| `description` | `string`                 | ❌       | Shown in the UI                        |
| `payload`     | `Record<string, string>` | ❌       | Field names → type labels              |
| `response`    | `string`                 | ❌       | Response event name                    |
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
