<div align="center">

# Deafiaa Serv

**Live status and showcase for community game servers.**

The server of the moment, the live status of running worlds, the games on offer and the archive of past seasons in a modern, responsive web app.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#-license)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-D97757?logo=anthropic&logoColor=white)](https://claude.com/claude-code)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Deployment (Docker)](#-deployment-docker)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 🔎 Overview

**Deafiaa Serv** is a self-hosted dashboard that showcases a community's game servers and their live status. It highlights the featured _"server of the moment"_ with its connection address, lists the other worlds currently running and the games on offer, and keeps an archive of past seasons whose world saves and files stay downloadable.

---

## ✨ Features

| Module             | Description                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| 🟢 **Live status** | Real-time player count, ping, map & version per server, queried via GameDig and cached server-side |
| 🖥️ **Infra stats** | CPU / RAM usage and power state pulled from the Proxmox VE API                                     |
| 📊 **History**     | Per-minute status snapshots stored in Postgres → uptime & player-count history graphs              |
| 🎮 **Multi-game**  | Minecraft (Java / Bedrock), Valheim, ARK, CS2, Rust, Garry's Mod, Terraria, Factorio               |
| 📦 **Downloads**   | World saves, modpacks & configs per server, served from local files or external links              |
| 🗂️ **Archive**     | Retired seasons & servers stay browsable, with their maps and files                                |
| 🔐 **Admin panel** | Single-admin (password + signed `jose` JWT cookie) CRUD over the server catalog                    |
| 🎨 **Modern UI**   | Responsive Tailwind CSS 4 design with per-game theming and an ambient background                   |

---

## 🛠 Tech Stack

| Area               | Technologies                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, instrumentation hook, standalone output) |
| **UI**             | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)                              |
| **Language**       | [TypeScript 5](https://www.typescriptlang.org/)                                                         |
| **Database**       | [PostgreSQL 17](https://www.postgresql.org/) via [Drizzle ORM](https://orm.drizzle.team/) (`pg`)        |
| **Authentication** | Single-admin password + [jose](https://github.com/panva/jose) (HS256 JWT) in an httpOnly cookie         |
| **Game queries**   | [GameDig](https://github.com/gamedig/node-gamedig) (live server status over UDP/TCP)                    |
| **Infra stats**    | [Proxmox VE](https://www.proxmox.com/) API (CPU / RAM)                                                  |
| **Testing**        | [Vitest](https://vitest.dev/)                                                                           |
| **Infra (deploy)** | [Docker](https://www.docker.com/) & Docker Compose (self-migrating standalone image)                    |

---

## ✅ Prerequisites

- [Node.js](https://nodejs.org/) **20.9+** (required by Next.js 16)
- [Docker](https://www.docker.com/) & Docker Compose (for the local PostgreSQL database)
- npm (or yarn / pnpm / bun)
- _(optional)_ a [Proxmox VE](https://www.proxmox.com/) host with a read-only API token, for CPU/RAM stats

---

## 🚀 Installation

```bash
# 1. Clone the repository
git clone https://github.com/Aidesu/project-02
cd project-02

# 2. Install dependencies
npm install

# 3. Configure your environment
cp .env.example .env.local   # then fill in the variables (see below)

# 4. Start a PostgreSQL database (example)
docker run -d --name app-postgres \
  -e POSTGRES_USER=appuser -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=appdb \
  -p 5432:5432 -v app-pgdata:/var/lib/postgresql/data postgres:17

# 5. Apply the Drizzle migrations
npm run db:migrate

# 6. Seed the catalog from data/servers.ts
npm run db:seed

# 7. Start the development server
npm run dev
```

The app is then available at **[http://localhost:3000](http://localhost:3000)**. The admin panel lives at **`/admin`** (sign in at `/login` with `ADMIN_PASSWORD`).

> 💡 Drizzle and the seed script read **`.env.local`** first, so that's the file to fill in for local development.

---

## 🔑 Environment Variables

Create a `.env.local` file at the root using the following keys (see `.env.example`):

| Variable               | Description                                                           | Example                                               |
| ---------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string (read by Drizzle)                        | `postgresql://appuser:change-me@localhost:5432/appdb` |
| `ADMIN_PASSWORD`       | Password for the single-admin `/admin` area                           | `change-me`                                           |
| `AUTH_SECRET`          | Secret used to sign the session JWT cookie                            | generated via `openssl rand -base64 32`               |
| `PROXMOX_URL`          | Proxmox VE API URL (port 8006) — _optional_                           | `https://proxmox.example.local:8006`                  |
| `PROXMOX_TOKEN`        | API token `USER@REALM!TOKENNAME=SECRET` (grant `VM.Audit`)            | `monitor@pve!gameservers=…`                           |
| `PROXMOX_INSECURE_TLS` | Accept Proxmox's self-signed certificate (trusted LAN only)           | `true`                                                |
| `DOWNLOADS_DIR`        | Root of downloadable files, expected at `DOWNLOADS_DIR/<slug>/<file>` | `/srv/gameservers`                                    |

> ⚠️ Env files (`.env*`) should **never** be committed — they are already listed in `.gitignore`. The Proxmox variables are optional: without them the CPU/RAM panel is simply hidden.

---

## 📜 Available Scripts

| Command               | Action                                            |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Starts the development server                     |
| `npm run build`       | Builds the app for production (standalone output) |
| `npm run start`       | Runs the built app                                |
| `npm run lint`        | Lints the code with ESLint                        |
| `npm run test`        | Runs the test suite with Vitest                   |
| `npm run test:watch`  | Runs Vitest in watch mode                         |
| `npm run db:generate` | Generates a Drizzle migration from the schema     |
| `npm run db:migrate`  | Applies pending migrations                        |
| `npm run db:push`     | Pushes the schema straight to the database        |
| `npm run db:studio`   | Opens Drizzle Studio                              |
| `npm run db:seed`     | Seeds the catalog from `data/servers.ts`          |
| `npm run db:init`     | One-shot bootstrap: migrate + seed only if empty  |

---

## 🐳 Deployment (Docker)

The repository ships a self-contained image: it builds Next.js in `standalone` mode, then **migrates and seeds-if-empty on boot** (see `docker-entrypoint.sh`), so a single command brings up the database and the app together.

```bash
# Fill in the secrets, then build & run
cp .env.docker.example .env
docker compose up --build        # → http://localhost:3000
```

Downloadable files are mounted read-only into the container at `DOWNLOADS_DIR`. For a pre-built image from a registry (e.g. Portainer / GHCR), use **`docker-compose.portainer.yml`** instead — it pulls an image rather than building locally.

---

## 📁 Project Structure

```
app/
├── page.tsx              # Home: featured server, games on offer, active servers, history teaser
├── serveurs/[slug]/      # Public server detail page
├── historique/           # Archived seasons & retired servers
├── admin/                # Admin panel (create / edit / delete servers)
│   ├── new/
│   └── [slug]/edit/
├── login/                # Single-admin login
├── api/
│   ├── live/             #   Aggregated live status for all active servers
│   ├── status/[slug]/    #   Live status for one server (GameDig)
│   ├── proxmox/[slug]/   #   CPU / RAM stats (Proxmox)
│   ├── history/[slug]/   #   Status-snapshot history
│   ├── download/[slug]/  #   File downloads
│   └── health/           #   Health check
└── _components/          # UI components (cards, hero, live panels, charts…)
lib/
├── db/                   # Drizzle schema, migrations, repositories & seed
├── auth.ts               # Single-admin session (jose JWT cookie)
├── gamedig.ts · live.ts  # Live game-server queries (+ caching)
├── poller.ts             # Background snapshot poller (started in instrumentation.ts)
├── proxmox.ts            # Proxmox VE API client
├── games.ts              # Supported-games registry
├── downloads.ts          # Safe file-download resolution
└── rate-limit.ts         # Simple per-route rate limiting
data/
└── servers.ts            # Seed catalog (loaded by `npm run db:seed`)
scripts/                  # db-init · seed
public/games/             # Per-game background art
```

---

## 📄 License

Released under the **MIT** License. See the `LICENSE` file for details.

---

<div align="center">

created by **[Carla Deafiaa](https://github.com/Aidesu)**

</div>
