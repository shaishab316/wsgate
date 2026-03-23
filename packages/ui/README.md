<div align="center">
  <img src="https://github.com/shaishab316/wsgate/blob/main/packages/ui/src/assets/icon.png?raw=true" width="120px" alt="WSGate UI Logo">

# @wsgate/ui

**The UI layer for the wsgate ecosystem**

[![npm version](https://img.shields.io/npm/v/@wsgate/ui?color=crimson&style=flat-square)](https://www.npmjs.com/package/@wsgate/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../LICENSE)

</div>

## Overview

`@wsgate/ui` is the browser UI for [wsgate](https://github.com/shaishab316/wsgate) — a real-time WebSocket event explorer and debugger. It builds to a single self-contained `index.html` file (via `vite-plugin-singlefile`) which is served by `@wsgate/nest` at the configured route path.

> You typically don't install this package directly.
> Use [`@wsgate/nest`](../nest/README.md) instead — it includes this UI automatically.

[![Demo Screenshot](https://github.com/shaishab316/wsgate/blob/main/images/showcase-1.png?raw=true)](https://github.com/shaishab316/wsgate/blob/main/images/showcase-1.png?raw=true)

---

## Local Development

```bash
pnpm --filter @wsgate/ui dev
```

Runs at `http://localhost:5173`. Point it at a running `@wsgate/nest` instance for live data.

## Build

```bash
pnpm --filter @wsgate/ui build
```

Outputs a single `dist/index.html` with all JS and CSS inlined.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](/LICENSE) for details.
