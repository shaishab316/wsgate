.PHONY: install build build-ui build-nest clean \
        dev-ui dev-docs \
        example \
        publish publish-ui publish-nest \
        release help

# ── Defaults ──────────────────────────────────
PM          := pnpm
EXAMPLE_DIR := examples/nest-example

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Setup ─────────────────────────────────────
install: ## Install all workspace dependencies
	$(PM) install

# ── Build ─────────────────────────────────────
build-ui: ## Build @wsgate/ui
	$(PM) --filter @wsgate/ui build

build-nest: ## Build @wsgate/nest
	$(PM) --filter @wsgate/nest build

build: build-ui build-nest ## Build all packages (ui first, then nest)

clean: ## Remove all dist folders
	rm -rf packages/ui/dist packages/nest/dist

# ── Dev ───────────────────────────────────────
dev-ui: ## Run @wsgate/ui dev server
	$(PM) --filter @wsgate/ui dev

dev-docs: ## Run docs dev server
	$(PM) --filter wsgate-docs dev

# ── Example ───────────────────────────────────
example: ## Run nest-example example
	$(PM) --filter nest-example start:dev

# ── Publishing ────────────────────────────────
publish-ui: build-ui ## Build and publish @wsgate/ui
	$(PM) --filter @wsgate/ui publish

publish-nest: build-nest ## Build and publish @wsgate/nest
	$(PM) --filter @wsgate/nest publish

publish: build ## Build and publish both packages (ui first)
	$(PM) --filter @wsgate/ui publish
	$(PM) --filter @wsgate/nest publish

# ── Release ───────────────────────────────────
release: clean build publish ## Full release: clean → build → publish