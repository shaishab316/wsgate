# ─────────────────────────────────────────────
#  nestjs-wsgate — Makefile
# ─────────────────────────────────────────────

.PHONY: install build clean lint lint-fix format \
        test test-watch test-cov dev \
        example-install example-link example-dev example-build example \
        pack publish release help

# ── Defaults ──────────────────────────────────
NODE_MANAGER := pnpm
DIST_DIR     := dist
EXAMPLE_DIR  := examples/simple-chat-app

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Setup ─────────────────────────────────────
install: ## Install root dependencies
	$(NODE_MANAGER) install

# ── Build ─────────────────────────────────────
build: clean ## Build package (ts → dist) and UI (ts, react → static)
	$(NODE_MANAGER) run build

clean: ## Remove dist/
	rm -rf $(DIST_DIR)

# ── Code Quality ──────────────────────────────
lint: ## Run ESLint
	$(NODE_MANAGER) run lint

lint-fix: ## Run ESLint with auto-fix
	$(NODE_MANAGER) run lint -- --fix

format: ## Run Prettier
	$(NODE_MANAGER) run format

# ── Testing ───────────────────────────────────
test: ## Run all tests
	$(NODE_MANAGER) run test

test-watch: ## Run tests in watch mode
	$(NODE_MANAGER) run test:watch

test-cov: ## Run tests with coverage report
	$(NODE_MANAGER) run test:cov

# ── Dev ───────────────────────────────────────
dev: ## Watch-compile the package (ts → dist) in dev mode
	$(NODE_MANAGER) run build:watch

# ── Example: simple-chat-app ──────────────────
example-install: ## Install simple-chat-app dependencies
	cd $(EXAMPLE_DIR) && $(NODE_MANAGER) install

example-link: build ## Build package then link into simple-chat-app
	$(NODE_MANAGER) link --global
	cd $(EXAMPLE_DIR) && $(NODE_MANAGER) link --global nestjs-wsgate

example-dev: ## Run simple-chat-app in watch mode
	cd $(EXAMPLE_DIR) && $(NODE_MANAGER) run start:dev

example-build: ## Build simple-chat-app
	cd $(EXAMPLE_DIR) && $(NODE_MANAGER) run build

example: example-install example-link example-dev ## Full flow: install → link → run simple-chat-app

# ── Publishing ────────────────────────────────
pack: build ## Build and pack locally (dry-run publish)
	$(NODE_MANAGER) pack

publish: build ## Publish to npm registry
	$(NODE_MANAGER) publish --access public

release: lint test build ## Full release gate: lint → test → build → publish
	$(NODE_MANAGER) publish --access public 