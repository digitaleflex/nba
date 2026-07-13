# Ops NBA — raccourcis VPS
# Usage: make <cible>   (ex: make status, make ws, make logs)

APP_CONTAINER ?= nba-app-1
REDIS_CONTAINER ?= nba-redis-1

.PHONY: status logs shell ws pm2 build restart redis help

help: ## Liste des cibles
	@echo "Cibles disponibles:"
	@echo "  make status   - diagnostic complet (site, WS, PM2, Redis, DB)"
	@echo "  make logs     - logs du conteneur app (follow)"
	@echo "  make shell    - shell dans le conteneur app"
	@echo "  make ws       - logs du worker WebSocket"
	@echo "  make pm2      - statut PM2 (nextjs + websocket)"
	@echo "  make redis    - redis-cli"
	@echo "  make build    - rebuild de l'image app"
	@echo "  make restart  - redémarre le conteneur app"

status: ## Diagnostic complet
	bash scripts/status.sh

logs: ## Logs app (follow)
	docker compose logs -f app

shell: ## Shell dans le conteneur app
	docker compose exec app sh

ws: ## Logs du worker WebSocket
	docker compose exec $(APP_CONTAINER) su -s /bin/sh -c 'npx pm2 logs websocket' nextjs

pm2: ## Statut PM2
	docker compose exec $(APP_CONTAINER) su -s /bin/sh -c 'npx pm2 status' nextjs

redis: ## redis-cli
	docker compose exec $(REDIS_CONTAINER) redis-cli

build: ## Rebuild image app
	docker compose build app

restart: ## Redémarre le conteneur app
	docker compose up -d app
