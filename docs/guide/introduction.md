# Introduction

NestJS has `@nestjs/swagger` for REST. Socket.IO gateways have nothing.

**wsgate** fills that gap — an interactive browser UI like Swagger UI, but for your WebSocket events. It auto-discovers every method decorated with `@WsDoc()` and lets you emit events, inspect payloads, and watch live responses without writing a single test client.

## Features

- **Auto-discovery** — scans all gateway providers at bootstrap
- **Interactive UI** — emit events and inspect responses in real time
- **Monaco Editor** — JSON payload editing with validation and faker support
- **Code generation** — generate client code in 9+ languages
- **Multi-namespace** — groups events by namespace automatically
- **Zero config** — one line in `main.ts`

## Packages

| Package                                                      | Description                                       |
| ------------------------------------------------------------ | ------------------------------------------------- |
| [`@wsgate/nest`](https://www.npmjs.com/package/@wsgate/nest) | NestJS adapter — decorators, explorer, module     |
| [`@wsgate/ui`](https://www.npmjs.com/package/@wsgate/ui)     | React UI — served automatically by `@wsgate/nest` |
