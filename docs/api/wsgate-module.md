# WsgateModule

The main module. Call `WsgateModule.setup()` in `main.ts` after creating the app.

## `setup(routePath, app, options?)`

| Parameter   | Type               | Description                              |
| ----------- | ------------------ | ---------------------------------------- |
| `routePath` | `string`           | Route to mount the UI (e.g. `'/wsgate'`) |
| `app`       | `INestApplication` | The running NestJS app instance          |
| `options`   | `WsgateOptions`    | Optional config                          |

## `WsgateOptions`

| Option     | Type      | Default    | Description                  |
| ---------- | --------- | ---------- | ---------------------------- |
| `title`    | `string`  | `'WsGate'` | Title shown in the UI header |
| `disabled` | `boolean` | `false`    | Disable the UI entirely      |

## Example

```typescript
await WsgateModule.setup('/wsgate', app, {
  title: 'Chat API',
  disabled: process.env.NODE_ENV === 'production',
});
```
