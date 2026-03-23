<div align="center">

<img src="./packages/ui/src/assets/icon.png" alt="wsgate logo" width="120" />

# wsgate

**Interactive Swagger-like UI for NestJS Socket.IO Gateway Events**

[![npm version](https://img.shields.io/npm/v/@wsgate/nest?color=crimson&style=flat-square)](https://www.npmjs.com/package/@wsgate/nest)
[![npm downloads](https://img.shields.io/npm/dm/@wsgate/nest?style=flat-square)](https://www.npmjs.com/package/@wsgate/nest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-10%2B-red?style=flat-square&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

</div>

<br/>

NestJS has `@nestjs/swagger` for REST. Socket.IO gateways have nothing.

`wsgate` adds a browser UI — like Swagger UI but for your WebSocket events. It auto-discovers every `@SubscribeMessage()` decorated with `@WsDoc()` and lets you emit events, inspect payloads, and watch live responses — without writing a single test client.

[![Demo Screenshot](./images/showcase-1.png)](./images/showcase-1.png)

---

## Packages

| Package                                     | Description                                       | npm                                                                                                               |
| ------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [`@wsgate/nest`](./packages/nest/README.md) | NestJS adapter — decorators, explorer, module     | [![npm](https://img.shields.io/npm/v/@wsgate/nest?style=flat-square)](https://www.npmjs.com/package/@wsgate/nest) |
| [`@wsgate/ui`](./packages/ui/README.md)     | React UI — served automatically by `@wsgate/nest` | [![npm](https://img.shields.io/npm/v/@wsgate/ui?style=flat-square)](https://www.npmjs.com/package/@wsgate/ui)     |

---

## Quick Start

```bash
pnpm add @wsgate/nest
```

**`app.module.ts`**

```typescript
import { DiscoveryModule } from "@nestjs/core";
import { WsgateExplorer } from "@wsgate/nest";

@Module({
  imports: [DiscoveryModule, ChatModule],
  providers: [WsgateExplorer],
})
export class AppModule {}
```

**`main.ts`**

```typescript
import { WsgateModule } from "@wsgate/nest";

await WsgateModule.setup("/wsgate", app, { title: "My App" });
await app.listen(3000);
// → http://localhost:3000/wsgate
```

**Gateway**

```typescript
import { WsDoc } from "@wsgate/nest";

@WsDoc({
  event: "message:send",
  description: "Send a message to a room.",
  payload: { room: "string", text: "string" },
  response: "message:receive",
  type: "emit",
})
@SubscribeMessage("message:send")
handleSendMessage(@MessageBody() data: { room: string; text: string }) {}
```

For full usage see [`@wsgate/nest` docs](./packages/nest/README.md).

---

## Monorepo Structure

```
wsgate/
├── packages/
│   ├── nest/        → @wsgate/nest  (NestJS adapter)
│   └── ui/          → @wsgate/ui    (React UI)
├── examples/
│   └── nest-example/             (NestJS example)
├── package.json     (workspace root)
└── pnpm-workspace.yaml
```

---

## Local Development

```bash
# Install all dependencies
pnpm install

# Build UI
pnpm --filter @wsgate/ui build

# Build nest
pnpm --filter @wsgate/nest build

# Run example app
pnpm --filter nest-example start:dev
# → http://localhost:3000/wsgate
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
Package-specific guides: [nest](./packages/nest/CONTRIBUTING.md) · [ui](./packages/ui/CONTRIBUTING.md)

Open an issue before a large PR.

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">
<b>If this saved you from writing another throwaway test client, drop a ⭐</b>
</div>
