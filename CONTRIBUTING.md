# Contributing to nestjs-wsgate

Thanks for taking the time to contribute! This is a small focused package — please read this before opening a PR.

---

## Project Structure

```
nestjs-wsgate/
├── src/          # Package source (decorators, explorer, module)
├── ui/           # Vite + React dev UI
├── example/      # Example NestJS app
└── dist/         # Built output (do not edit)
```

---

## Local Development

```bash
git clone https://github.com/shaishab316/nestjs-wsgate.git
cd nestjs-wsgate
pnpm install
pnpm dev          # builds the package in watch mode + starts the UI dev server
```

To test against the example app:

```bash
cd example
pnpm install
pnpm dev
# → http://localhost:3000/wsgate
```

---

## Before Opening a PR

- **Open an issue first** for any non-trivial change — bug fix, new feature, API change. This avoids wasted effort if the direction doesn't fit the project.
- Keep PRs focused. One fix or feature per PR.
- If you're changing the `@WsDoc` API or `WsgateModule.setup()` signature, discuss in the issue first.

---

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add namespace filter to UI
fix: explorer not picking up lazy-loaded modules
docs: update WsDoc options table
chore: bump socket.io peer dep to v4.8
```

---

## Reporting Bugs

Open a GitHub issue and include:

- NestJS version
- `nestjs-wsgate` version
- Minimal reproduction (your gateway + `AppModule` setup)
- What you expected vs what happened

---

## License

By contributing, you agree your code will be licensed under [MIT](LICENSE).
