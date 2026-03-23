.PHONY: install build build-ui build-nest build-express clean \
        dev-ui dev-docs \
        example example-express \
        publish publish-ui publish-nest publish-express \
        release help

# ── Defaults ──────────────────────────────────
PM := pnpm

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

build-express: ## Build @wsgate/express
	$(PM) --filter @wsgate/express build

build: build-ui build-nest build-express ## Build all packages (ui first)

clean: ## Remove all dist folders
	rm -rf packages/ui/dist packages/nest/dist packages/express/dist

# ── Dev ───────────────────────────────────────
dev-ui: ## Run @wsgate/ui dev server
	$(PM) --filter @wsgate/ui dev

dev-docs: ## Run docs dev server
	$(PM) --filter wsgate-docs dev

# ── Examples ──────────────────────────────────
example-nest: ## Run nest-example
	$(PM) --filter nest-example start:dev

example-express: ## Run express-example
	$(PM) --filter express-example dev

# ── Publishing ────────────────────────────────
publish-ui: build-ui ## Build and publish @wsgate/ui
	$(PM) --filter @wsgate/ui publish

publish-nest: build-nest ## Build and publish @wsgate/nest
	$(PM) --filter @wsgate/nest publish

publish-express: build-express ## Build and publish @wsgate/express
	$(PM) --filter @wsgate/express publish

publish: build ## Build and publish all packages (ui first)
	$(PM) --filter @wsgate/ui publish
	$(PM) --filter @wsgate/nest publish
	$(PM) --filter @wsgate/express publish

# ── Release ───────────────────────────────────
release: clean build publish ## Full release: clean → build → publish