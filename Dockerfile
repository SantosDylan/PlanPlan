# Artefact de déploiement (cible : Dokploy). PlanPlan est un site STATIQUE :
# on compile avec Node, puis on sert `web/dist` avec nginx. L'image finale ne
# contient donc ni Node, ni les sources, ni les dépendances (~55 Mo).
#
# Piège du monorepo : le script `prepare` de web/ lance `panda codegen`, qui a
# besoin de panda.config.ts. Et npm lance le `prepare` des workspaces MÊME avec
# --ignore-scripts (vérifié : l'install échoue sinon sur ERR_PANDA_CONFIG_NOT_FOUND).
# D'où la copie du fichier de config avec les manifestes, avant l'install.
FROM node:22-alpine AS build
WORKDIR /app

# Manifestes seuls d'abord : tant qu'ils ne bougent pas, Docker réutilise le
# cache de l'install. Ça compte ici — le cron d'ingestion commite des données
# 2x/jour, et chacun de ces commits déclenche un déploiement.
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY ingest/package.json ingest/
COPY web/panda.config.ts web/
RUN npm ci

COPY . .
# styled-system/ est git-ignoré (donc absent du contexte de build) : il a été
# généré par le `prepare` ci-dessus, on le régénère ici par sécurité — panda
# codegen est idempotent et prend deux secondes.
RUN npm run prepare -w web
# BASE_PATH n'est PAS défini ici, donc vite.config.ts retombe sur `base: '/'`.
# C'est la différence avec GitHub Pages, qui sert le site sous /PlanPlan/ :
# sur un sous-domaine dédié, le site est à la racine.
RUN npm run build

# --- Runtime ----------------------------------------------------------------
FROM nginx:alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
