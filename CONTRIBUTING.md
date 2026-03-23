# Contributing to wsgate

Thanks for your interest. This is a pnpm monorepo — read this before opening a PR.

---

## Packages

| Package        | Location         | Purpose                                       |
| -------------- | ---------------- | --------------------------------------------- |
| `@wsgate/nest` | `packages/nest/` | NestJS adapter — decorators, explorer, module |
| `@wsgate/ui`   | `packages/ui/`   | React UI — served by `@wsgate/nest`           |

For package-specific guidelines:

- [`packages/nest/CONTRIBUTING.md`](./packages/nest/CONTRIBUTING.md)
- [`packages/ui/CONTRIBUTING.md`](./packages/ui/CONTRIBUTING.md)

---

## Setup

```bash
git clone https://github.com/shaishab316/wsgate.git
cd nestjs-wsgate
pnpm install
```

---

## Development Workflow

```bash
# Build UI first (nest depends on it)
pnpm --filter @wsgate/ui build

# Build nest
pnpm --filter @wsgate/nest build

# Run example to verify end-to-end
pnpm --filter simple-chat-app start:dev
# → http://localhost:3000/wsgate
```

---

## Branch Convention

| Branch         | Purpose                 |
| -------------- | ----------------------- |
| `main`         | Stable, published state |
| `feat/<name>`  | New features            |
| `fix/<name>`   | Bug fixes               |
| `chore/<name>` | Tooling, deps, docs     |

Always branch off `main`. Open a PR back to `main`.

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(nest): add namespace filtering to explorer
fix(ui): resolve monaco blank panel on event change
chore: bump pnpm to 10.32.1
docs: update quick start in root README
```

Scope is the package name — `nest`, `ui`, or omit for monorepo-wide changes.

---

## Before Opening a PR

- [ ] `pnpm --filter @wsgate/ui build` passes
- [ ] `pnpm --filter @wsgate/nest build` passes
- [ ] `pnpm --filter simple-chat-app start:dev` works end-to-end
- [ ] JSDoc added for any new public API
- [ ] README updated if user-facing behaviour changed
- [ ] Open an issue first for large or breaking changes

---

## Reporting Issues

Use the GitHub issue templates:

- **Bug report** — unexpected behaviour with steps to reproduce
- **Feature request** — describe the problem, not just the solution

---

## License

By contributing you agree your code will be released under the [MIT License](./LICENSE).
