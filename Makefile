# ──────────────────────────────────────────────────────────────────────
# Development Framework — Makefile
# ──────────────────────────────────────────────────────────────────────
# Usage:
#   make up           — Start current branch (no git switch)
#   make down         — Stop all containers
#   make restart      — Restart all containers
#   make build        — Rebuild images only (no start)
#   make logs         — Tail all logs
#   make logs-back    — Tail backend logs
#   make logs-front   — Tail frontend logs
#   make status       — Show container status + current branch
#   make shell-back   — Open shell in backend container
#   make shell-db     — Open psql in postgres container
#   make test         — Run backend tests
#   make clean        — Stop containers and remove volumes (⚠ destructive)
#   make seed         — Re-run seed (restarts backend with RUN_SEED=true)
# ──────────────────────────────────────────────────────────────────────

.PHONY: up up-prod down restart build logs logs-back logs-front \
        status stats shell-back shell-db test clean seed help \
        new-entity types lint

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
CYAN   := \033[0;36m
NC     := \033[0m  # No Color

# Default target
.DEFAULT_GOAL := help

# ──────────────────── Docker operations ────────────────────

up: ## Start containers with dev override (hot-reload)
	docker compose up -d --build
	@sleep 2
	@$(MAKE) --no-print-directory status

up-prod: ## Start containers without dev override (production-ish)
	docker compose -f docker-compose.yml up -d --build
	@sleep 2
	@$(MAKE) --no-print-directory status

down: ## Stop all containers
	docker compose down --remove-orphans

restart: ## Restart all containers
	docker compose restart
	@sleep 2
	@$(MAKE) --no-print-directory status

build: ## Rebuild images without starting
	docker compose build

# ──────────────────── Logging ────────────────────

logs: ## Tail logs for all services
	docker compose logs -f --tail 50

logs-back: ## Tail backend logs
	docker compose logs -f --tail 50 backend

logs-front: ## Tail frontend logs
	docker compose logs -f --tail 50 frontend

# ──────────────────── Status & info ────────────────────

status: ## Show container status and current branch
	@echo ""
	@CURRENT_BRANCH=$$(git branch --show-current 2>/dev/null || echo "unknown"); \
	printf "  Branch:      $(CYAN)$$CURRENT_BRANCH$(NC)\n"; \
	printf "  URL:         http://127.0.0.1\n"; \
	printf "\n"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps

stats: ## Show RAM, CPU and memory usage per container
	@printf "\n"
	@printf "  $(CYAN)Container Resource Usage$(NC)\n"
	@printf "\n"
	@docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}" | grep -E "NAME|framework"
	@printf "\n"

# ──────────────────── Shell access ────────────────────

shell-back: ## Open a bash shell in the backend container
	docker compose exec backend bash

shell-db: ## Open psql in the postgres container
	docker compose exec postgres psql -U framework -d framework

# ──────────────────── Testing ────────────────────

test: ## Run backend tests (⚠ truncates tasks/users/refresh_tokens — use a disposable DB)
	@printf "$(RED)⚠  Tests TRUNCATE users/tasks/refresh_tokens in the target DB.$(NC)\n"
	@printf "$(YELLOW)   Set PYTEST_ALLOW_ANY_DB=1 only if the DB is disposable.$(NC)\n"
	docker compose exec -e PYTEST_ALLOW_ANY_DB=1 backend python -m pytest tests/ -v

# ──────────────────── Scaffolding ────────────────────

new-entity: ## Scaffold a new owned entity. Usage: make new-entity NAME=Project FIELDS="title:str"
	@if [ -z "$(NAME)" ]; then \
		printf "$(RED)NAME is required. Example:$(NC)\n  make new-entity NAME=Project FIELDS=\"title:str,description:text?\"\n"; \
		exit 1; \
	fi
	python3 scripts/new_entity.py --name "$(NAME)" --fields "$(FIELDS)"

types: ## Regenerate frontend/src/types/api.ts from the running backend OpenAPI
	cd frontend && npx openapi-typescript http://localhost/openapi.json -o src/types/api.ts

# ──────────────────── Maintenance ────────────────────

seed: ## Re-run seed (restarts backend with RUN_SEED=true)
	docker compose exec backend python -c "import asyncio; from app.seed import seed; asyncio.run(seed())"

clean: ## ⚠ Stop containers and remove ALL volumes (destructive)
	@printf "$(RED)⚠  This will delete ALL data volumes!$(NC)\n"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose down -v --remove-orphans

# ──────────────────── Help ────────────────────

help: ## Show this help
	@printf "\n"
	@printf "$(GREEN)Development Framework$(NC) — Available commands:\n"
	@printf "\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-14s$(NC) %s\n", $$1, $$2}'
	@printf "\n"
