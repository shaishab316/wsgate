# Quick Start

## 1. Register in app module

```typescript
import { DiscoveryModule } from '@nestjs/core';
import { WsgateExplorer } from '@wsgate/nest';

@Module({
  imports: [DiscoveryModule, ChatModule],
  providers: [WsgateExplorer],
})
export class AppModule {}
```

## 2. Mount the UI

```typescript
import { WsgateModule } from '@wsgate/nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await WsgateModule.setup('/wsgate', app, { title: 'My App' });
  await app.listen(3000);
}
bootstrap();
```

## 3. Document your events

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

Open `http://localhost:3000/wsgate` — done.
