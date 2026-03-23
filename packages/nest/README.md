<div align="center">

<img src="../ui/src/assets/icon.png" alt="nestjs-wsgate logo" width="120" />

# @wsgate/nest

**Interactive Swagger-like UI for NestJS Socket.IO Gateway Events**

[![npm version](https://img.shields.io/npm/v/@wsgate/nest?color=crimson&style=flat-square)](https://www.npmjs.com/package/@wsgate/nest)
[![npm downloads](https://img.shields.io/npm/dm/@wsgate/nest?style=flat-square)](https://www.npmjs.com/package/@wsgate/nest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-10%2B-red?style=flat-square&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

</div>

<br/>

NestJS has `@nestjs/swagger` for REST. Socket.IO gateways have nothing.

`@wsgate/nest` adds a browser UI — like Swagger UI but for your WebSocket events. It auto-discovers every `@SubscribeMessage()` in your app and lets you emit events, inspect payloads, and watch live responses — without writing a single test client.

---

## Installation

```bash
pnpm add @wsgate/nest
```

## Setup

**`app.module.ts`** — add `DiscoveryModule` and `WsgateExplorer`:

```typescript
import { DiscoveryModule } from "@nestjs/core";
import { WsgateExplorer } from "@wsgate/nest";

@Module({
  imports: [DiscoveryModule, ChatModule, AdminModule],
  providers: [WsgateExplorer],
})
export class AppModule {}
```

**`main.ts`** — mount the UI before `app.listen()`:

```typescript
import { WsgateModule } from "@wsgate/nest";

await WsgateModule.setup("/wsgate", app, { title: "My App" });
await app.listen(3000);
// → http://localhost:3000/wsgate
```

## Documenting Events

Use `@WsDoc()` on your gateway handlers. Two types: `emit` (client → server) and `subscribe` (server → client).

```typescript
import { WsDoc } from '@wsgate/nest';

// Client sends this
@WsDoc({
  event: 'message:send',
  description: 'Send a message to a room.',
  payload: { room: 'string', text: 'string' },
  response: 'message:receive',
  type: 'emit',
})
@SubscribeMessage('message:send')
handleSendMessage(@MessageBody() data: { room: string; text: string }) { ... }

// Client listens for this (stub — no @SubscribeMessage needed)
@WsDoc({
  event: 'message:receive',
  description: 'Broadcasted message from a room.',
  payload: { username: 'string', text: 'string', timestamp: 'string' },
  type: 'subscribe',
})
onMessageReceive() {}
```

### `@WsDoc` options

| Option        | Type                     | Required | Description                       |
| ------------- | ------------------------ | -------- | --------------------------------- |
| `event`       | `string`                 | ✅       | Socket.IO event name              |
| `type`        | `'emit' \| 'subscribe'`  | ✅       | Direction of the event            |
| `description` | `string`                 | ✅       | Shown in the UI                   |
| `payload`     | `Record<string, string>` | ✅       | Field names → type labels         |
| `response`    | `string`                 | ❌       | Response event name (`emit` only) |

## Multiple Gateways

Just import all gateway modules — `WsgateExplorer` picks them all up automatically. Each namespace appears as its own section in the UI.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Open an issue before a large PR.

## License

See [LICENSE](/LICENSE) for details.

---

<div align="center">
<b>If this saved you from writing another throwaway test client, drop a ⭐</b>
</div>
