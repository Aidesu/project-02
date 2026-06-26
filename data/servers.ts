import type { Server } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
//  Vos serveurs.  Une entrée = un serveur.
//  - gameId        : clé d'un jeu défini dans lib/games.ts
//  - query.host    : IP/host à interroger pour le statut live (GameDig)
//  - proxmox       : VM/conteneur à interroger pour CPU/RAM (API Proxmox)
//  - current:true  → le serveur mis en avant dans la bannière de l'accueil
//  - archived:true → le serveur passe dans la page Historique
//  - downloads.file → fichier dans DOWNLOADS_DIR/<slug>/ (servi par /api/download)
//  - downloads.url  → lien externe (Drive, Mega...) à la place du fichier local
//  - images        → fichiers dans public/servers/<slug>/  (ex. /servers/smp/1.jpg)
//
//  TOUTES les valeurs ci-dessous sont des EXEMPLES anonymes (noms, adresses,
//  textes, IDs Proxmox). Remplacez-les par les vôtres. Aucune donnée réelle ici.
//  Ce catalogue ne sert qu'à amorcer une base VIDE (voir scripts/db-init.ts) :
//  une fois en prod, les serveurs s'éditent via /admin, pas dans ce fichier.
// ─────────────────────────────────────────────────────────────────────────

export const servers: Server[] = [
    {
        slug: "serveur-survie",
        name: "Serveur Survie — Exemple",
        gameId: "minecraft",
        current: true,
        summary:
            "Exemple de serveur mis en avant. Remplacez ce texte par la présentation de votre serveur.",
        description:
            "Texte d'exemple pour la fiche détaillée d'un serveur. Décrivez ici le type de " +
            "partie, les règles, les plugins ou mods éventuels et tout ce qui est utile aux joueurs.",
        query: { host: "jeu.exemple.com", port: 25565 },
        connect: "jouer.exemple.com",
        proxmox: { node: "pve", vmid: 100, type: "lxc" },
        startedAt: "2026-03-01",
        tags: ["exemple", "survie", "communautaire"],
        mods: [
            {
                name: "Aucun mod requis",
                required: false,
                note: "Exemple : un client de base suffit pour se connecter.",
            },
        ],
        downloads: [
            {
                label: "Fichier d'exemple (archive)",
                file: "exemple.zip",
                description:
                    "Exemple de téléchargement servi depuis DOWNLOADS_DIR/<slug>/.",
            },
        ],
    },
    {
        slug: "serveur-modde",
        name: "Serveur Moddé — Exemple",
        gameId: "minecraft",
        summary:
            "Exemple de serveur qui demande un modpack côté client pour se connecter.",
        description:
            "Texte d'exemple. Indiquez ici le modpack requis et la marche à suivre pour " +
            "l'installer avant de rejoindre le serveur.",
        query: { host: "modde.exemple.com", port: 25565 },
        connect: "modde.exemple.com",
        proxmox: { node: "pve", vmid: 101, type: "qemu" },
        startedAt: "2026-04-15",
        tags: ["exemple", "moddé"],
        mods: [
            {
                name: "Modpack d'exemple",
                url: "https://exemple.com/modpack",
                required: true,
                note: "Exemple : installer la même version que le serveur.",
            },
        ],
        downloads: [
            {
                label: "Lien externe d'exemple",
                url: "https://exemple.com/modpack",
            },
        ],
    },
    {
        slug: "serveur-coop",
        name: "Serveur Coop — Exemple",
        gameId: "valheim",
        summary:
            "Exemple de serveur coopératif privé pour quelques joueurs.",
        description:
            "Texte d'exemple décrivant une partie en coopération. À remplacer par vos propres informations.",
        query: { host: "coop.exemple.com", port: 2457 },
        connect: "coop.exemple.com:2456",
        proxmox: { node: "pve", vmid: 102, type: "lxc" },
        startedAt: "2026-05-20",
        tags: ["exemple", "coop"],
    },
    {
        slug: "serveur-pve",
        name: "Serveur PvE — Exemple",
        gameId: "ark",
        summary:
            "Exemple de serveur PvE avec des réglages personnalisés.",
        description:
            "Texte d'exemple. Décrivez ici les réglages du serveur (taux, règles, mode de jeu, etc.).",
        query: { host: "pve.exemple.com", port: 27015 },
        connect: "pve.exemple.com:7777",
        proxmox: { node: "pve", vmid: 103, type: "qemu" },
        startedAt: "2026-06-01",
        tags: ["exemple", "pve", "coop"],
    },
    {
        slug: "archive-saison-2",
        name: "Saison Précédente — Exemple",
        gameId: "minecraft",
        summary:
            "Exemple de serveur archivé. La map reste téléchargeable.",
        description:
            "Texte d'exemple pour une entrée d'historique. Conservée pour l'archive et le téléchargement.",
        startedAt: "2025-09-01",
        endedAt: "2026-02-25",
        archived: true,
        tags: ["exemple", "archive"],
        downloads: [
            { label: "Archive d'exemple (world)", file: "exemple-archive.zip" },
        ],
    },
    {
        slug: "archive-saison-1",
        name: "Ancienne Saison — Exemple",
        gameId: "minecraft",
        summary:
            "Exemple de serveur archivé, avec un fichier à télécharger.",
        description:
            "Texte d'exemple pour une entrée d'historique plus ancienne.",
        startedAt: "2025-03-10",
        endedAt: "2025-08-20",
        archived: true,
        tags: ["exemple", "archive"],
        downloads: [
            { label: "Archive d'exemple (world)", file: "exemple-archive-ancienne.zip" },
        ],
    },
    {
        slug: "archive-coop",
        name: "Ancien Serveur Coop — Exemple",
        gameId: "valheim",
        summary:
            "Exemple de serveur coopératif archivé en fin de saison.",
        description:
            "Texte d'exemple. Serveur conservé dans l'historique après la fin de la partie.",
        startedAt: "2025-06-01",
        endedAt: "2025-11-15",
        archived: true,
        tags: ["exemple", "coop", "archive"],
    },
    {
        slug: "archive-pvp",
        name: "Ancien Serveur PvP — Exemple",
        gameId: "rust",
        summary:
            "Exemple de serveur PvP archivé après la fin de la saison.",
        description:
            "Texte d'exemple. Serveur retiré et conservé ici pour l'historique.",
        startedAt: "2025-10-05",
        endedAt: "2026-01-10",
        archived: true,
        tags: ["exemple", "pvp", "archive"],
    },
];
