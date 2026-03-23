# nest-example

A minimal NestJS example app to test `nestjs-wsgate` locally.

## Run

```bash
# 1. Build the package first (in root)
cd ../..
pnpm build

# 2. Install & run the example
cd examples/nest-example
pnpm install
pnpm start:dev
```

```

## Test

1. Open `http://localhost:3000/wsgate`
2. Click **Connect**
3. Find `message` event
4. Fill payload `{ "msg": "hello" }`
5. Click **Emit**
6. Server console → `Client said: hello`
7. UI response → `Server: hello` ✅
```
