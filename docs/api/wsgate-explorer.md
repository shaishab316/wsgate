# WsgateExplorer

Scans all providers in the DI container for methods decorated with `@WsDoc()` and collects their metadata.

## Setup

Register as a provider in your root module:

```typescript
import { WsgateExplorer } from '@wsgate/nest';

@Module({
  imports: [DiscoveryModule],
  providers: [WsgateExplorer],
})
export class AppModule {}
```

`DiscoveryModule` from `@nestjs/core` is required.
