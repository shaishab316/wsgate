# @WsDoc

Decorator that marks a gateway method as a documented WebSocket event.

## Usage

```typescript
import { WsDoc } from '@wsgate/nest';

@WsDoc({
  event: 'message:send',
  description: 'Send a message to a room.',
  payload: { room: 'string', text: 'string' },
  response: 'message:receive',
  type: 'emit',
})
@SubscribeMessage('message:send')
handleSendMessage(@MessageBody() data: any) {}
```

## Options

| Option        | Type                     | Required | Description                       |
| ------------- | ------------------------ | -------- | --------------------------------- |
| `event`       | `string`                 | ✅       | Socket.IO event name              |
| `type`        | `'emit' \| 'subscribe'`  | ✅       | Direction of the event            |
| `description` | `string`                 | ❌       | Shown in the UI                   |
| `payload`     | `Record<string, string>` | ❌       | Field names → type labels         |
| `response`    | `string`                 | ❌       | Response event name (`emit` only) |

## Event Types

- **`emit`** — client sends this event to the server
- **`subscribe`** — server sends this event to the client (stub method, no `@SubscribeMessage` needed)
