# GameServers — tableau de bord de serveurs de jeu

Site auto-hébergé qui répertorie mes serveurs de jeu (hébergés sur Proxmox),
avec **statut en direct**, **statistiques CPU / RAM** et **téléchargements**
(maps, mods…).

- **Statut live des jeux** via [GameDig](https://github.com/gamedig/node-gamedig)
  (Minecraft, Valheim, jeux Source/Steam… ~320 jeux).
- **CPU / RAM** des VM/conteneurs via l'**API Proxmox VE**.
- **Téléchargements** servis en streaming avec reprise (HTTP Range), depuis un
  dossier hors du dépôt.
- Next.js 16 (App Router), React 19, Tailwind v4. Pensé pour l'**auto-hébergement**
  (`next start`), pas pour Vercel — le site doit pouvoir joindre le LAN et servir
  de gros fichiers.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis éditez les valeurs
npm run dev                  # http://localhost:3000
```

En production : `npm run build && npm run start` (idéalement derrière un reverse
proxy nginx, dans son propre conteneur Proxmox).

## Déploiement Docker

Tout est conteneurisé. L'image de l'app **s'auto-migre au démarrage** : elle
applique les migrations Drizzle, *seed* la base **si elle est vide**, puis lance
le serveur Next.js (mode `standalone`). Une seule image à déployer, pas d'étape
de migration séparée.

```bash
cp .env.docker.example .env   # renseignez ADMIN_PASSWORD / AUTH_SECRET, etc.
docker compose up --build     # → http://localhost:3000
```

- **`Dockerfile`** — multi-stage (`node:24-slim`) : `deps → builder → runner`.
  `output: "standalone"` ⇒ image runtime minimale, sans `node_modules`, en
  utilisateur non-root. Le builder bundle `scripts/db-init.ts` en un
  `dist/db-init.mjs` autonome ; `docker-entrypoint.sh` l'exécute avant de servir.
- **`docker-compose.yml`** — services `db` (postgres:17) + `app`. L'ordre est
  garanti par le *healthcheck* de `db`.
- **Migrations & seed** — idempotents : les migrations sont suivies, le *seed*
  n'a lieu que si la table est vide. Redémarrages et redéploiements ne touchent
  **jamais** aux serveurs édités via `/admin`. Si la base est injoignable, l'app
  démarre quand même en repli sur le catalogue statique.
- **Téléchargements** — le dossier hôte `DOWNLOADS_HOST_DIR` (déf. `./downloads`)
  est monté en lecture seule sur `DOWNLOADS_DIR`.
- **Base externe** — pour ne pas utiliser le Postgres embarqué, pointez
  `DATABASE_URL` ailleurs et lancez `docker compose up app`.

> Le `package-lock.json` est généré avec **npm 11 / Node 24** ; l'image est donc
> basée sur `node:24-slim` pour que `npm ci` soit reproductible (npm 10 échoue
> sur les binaires esbuild optionnels).

### Portainer (image pré-construite via GHCR)

Pour un hôte léger (ex. un CT Proxmox), on **ne build pas sur place** : le CI
GitHub (`.github/workflows/docker-publish.yml`) construit l'image et la pousse
sur **GHCR** à chaque push sur `main` ; Portainer ne fait que la *tirer*.

1. **Publier l'image** — pousser sur `main` (ou lancer le workflow à la main)
   produit `ghcr.io/aidesu/project-02:latest`. Rendez le package GHCR
   accessible (public, ou ajoutez des identifiants de registre dans Portainer).
2. **Créer la stack** — Portainer → *Stacks* → *Add stack* → *Web editor*, puis
   collez **`docker-compose.portainer.yml`**.
3. **Variables d'environnement** — dans la section *Environment variables* de la
   stack, renseignez au minimum :
   `POSTGRES_PASSWORD`, `DATABASE_URL` (hôte = `db`, ex.
   `postgresql://deafiaa:<pwd>@db:5432/deafiaa_serv`), `AUTH_SECRET`,
   `ADMIN_PASSWORD`. Optionnel : `APP_IMAGE`, `APP_PORT`, `PROXMOX_*`,
   `DOWNLOADS_HOST_DIR`.
4. **Déployer** — `db` démarre, l'app la rejoint, applique les migrations +
   *seed* initial, et sert. Pour mettre à jour : repoussez l'image, puis
   *Pull and redeploy* dans Portainer (`pull_policy: always`).

## Ajouter / modifier un serveur

Tout se passe dans **`data/servers.ts`** : une entrée par serveur. Champs
principaux (voir les types dans `lib/types.ts`) :

| Champ | Rôle |
|-------|------|
| `slug` | Identifiant URL (`/serveurs/<slug>`) |
| `gameId` | Clé d'un jeu défini dans `lib/games.ts` |
| `query` | `{ host, port }` interrogé pour le statut live |
| `proxmox` | `{ node, vmid, type }` pour les stats CPU/RAM |
| `archived` | `true` → le serveur passe dans **Historique** |
| `mods` | Mods tiers (avec lien et « requis / optionnel ») |
| `downloads` | Fichiers (`file` local) ou liens externes (`url`) |
| `images` | Images locales dans `public/servers/<slug>/…` |

### Ajouter un nouveau jeu

Ajoutez une entrée dans `lib/games.ts` (label, emoji, couleur, et `gamedigType`
correspondant à un id de
[GAMES_LIST.md](node_modules/gamedig/GAMES_LIST.md)), puis utilisez sa clé
comme `gameId`.

## Statistiques Proxmox

Créez un **token API** en lecture seule dans Proxmox
(*Datacenter → Permissions → API Tokens*, droit `VM.Audit`) et renseignez
`PROXMOX_URL`, `PROXMOX_TOKEN`, `PROXMOX_INSECURE_TLS` dans `.env.local`
(voir `.env.example`).

## Téléchargements

Les fichiers vivent **hors du dépôt**, dans `DOWNLOADS_DIR/<slug>/<fichier>`
(ex. `/srv/gameservers/smp-vanilla/world-saison3.zip`). Seuls les fichiers
**déclarés** dans `downloads` d'un serveur sont servis — aucune traversée de
répertoire possible. Pour de très gros volumes, on pourra basculer plus tard sur
un stockage objet (MinIO / S3) sans changer l'UI.

## Variables d'environnement

Voir `.env.example`. Aucune n'est obligatoire pour démarrer : sans Proxmox les
cartes masquent simplement le CPU/RAM, sans `DOWNLOADS_DIR` les boutons de
téléchargement de fichiers locaux renvoient 404.
