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
//  Les valeurs ci-dessous sont des EXEMPLES : remplacez-les par les vôtres.
// ─────────────────────────────────────────────────────────────────────────

export const servers: Server[] = [
    {
        slug: "smp-vanilla",
        name: "All The Forge 10 (custom)",
        gameId: "minecraft",
        current: true,
        summary:
            "Survie multijoueur vanilla, saison 4. Économie communautaire et grandes constructions.",
        description:
            "Serveur survie sans gros mods de gameplay : on garde l'expérience Minecraft d'origine, " +
            "avec quelques plugins de confort (claims de territoire, /home, économie). " +
            "La map est repartie de zéro pour la saison 4.",
        query: { host: "mc.exemple.fr", port: 25565 },
        connect: "wrench-johns.gl.joinmc.link",
        proxmox: { node: "pve", vmid: 101, type: "lxc" },
        startedAt: "2026-03-01",
        tags: ["survie", "vanilla+", "communautaire"],
        mods: [
            {
                name: "Aucun mod requis",
                required: false,
                note: "Client Minecraft vanilla suffisant.",
            },
        ],
        downloads: [
            {
                label: "Map de la saison 3 (archive)",
                file: "world-saison3.zip",
                description:
                    "Le monde complet de la saison précédente, à charger en solo.",
            },
        ],
    },
    {
        slug: "modpack-atm",
        name: "All The Mods 9",
        gameId: "minecraft",
        summary:
            "Serveur moddé ATM9 : tech, magie et exploration. Nécessite le modpack côté client.",
        description:
            "Gros pack tech/magie basé sur Forge. Le modpack est obligatoire pour se connecter — " +
            "installez-le via CurseForge avant de rejoindre.",
        query: { host: "atm9.exemple.fr", port: 25565 },
        connect: "atm9.exemple.fr",
        proxmox: { node: "pve", vmid: 102, type: "qemu" },
        startedAt: "2026-04-15",
        tags: ["moddé", "forge", "tech", "magie"],
        mods: [
            {
                name: "All The Mods 9",
                url: "https://www.curseforge.com/minecraft/modpacks/all-the-mods-9",
                required: true,
                note: "Installer la même version que le serveur via le launcher CurseForge.",
            },
        ],
        downloads: [
            {
                label: "Liste des mods (CurseForge)",
                url: "https://www.curseforge.com/minecraft/modpacks/all-the-mods-9",
            },
        ],
    },
    {
        slug: "valheim-vikings",
        name: "Valheim — Les Drakkars",
        gameId: "valheim",
        summary:
            "Exploration et boss en coopération. Serveur dédié privé entre amis.",
        description:
            "Aventure coopérative Valheim. Progression douce, sessions le week-end.",
        query: { host: "valheim.exemple.fr", port: 2457 },
        connect: "valheim.exemple.fr:2456",
        proxmox: { node: "pve", vmid: 103, type: "lxc" },
        startedAt: "2026-05-20",
        tags: ["coop", "survie", "viking"],
    },
    {
        slug: "ark-island",
        name: "ARK — The Island",
        gameId: "ark",
        summary:
            "Survie et dressage de dinos en coopération. Rates boostés pour des sessions plus rapides.",
        description:
            "Serveur ARK: Survival sur la map The Island. Taux de récolte, d'XP et d'éclosion augmentés " +
            "pour progresser sans y passer ses nuits. PvE entre amis, tribus autorisées.",
        query: { host: "ark.exemple.fr", port: 27015 },
        connect: "ark.exemple.fr:7777",
        proxmox: { node: "pve", vmid: 104, type: "qemu" },
        startedAt: "2026-06-01",
        tags: ["survie", "coop", "dinos", "pve"],
    },
    {
        slug: "smp-saison3",
        name: "SMP Entre Potes — Saison 3",
        gameId: "minecraft",
        summary:
            "Édition précédente du SMP, archivée. La map reste téléchargeable.",
        description:
            "Saison 3 terminée. Conservée ici pour l'historique et le téléchargement de la map.",
        startedAt: "2025-09-01",
        endedAt: "2026-02-25",
        archived: true,
        tags: ["survie", "archive"],
        downloads: [
            { label: "Map complète (world)", file: "world-saison3.zip" },
        ],
    },
    {
        slug: "smp-saison2",
        name: "SMP Entre Potes — Saison 2",
        gameId: "minecraft",
        summary:
            "Deuxième saison du SMP, archivée. La map complète reste téléchargeable.",
        description:
            "Saison 2 terminée. Conservée ici pour l'historique et le téléchargement de la map.",
        startedAt: "2025-03-10",
        endedAt: "2025-08-20",
        archived: true,
        tags: ["survie", "archive"],
        downloads: [
            { label: "Map complète (world)", file: "world-saison2.zip" },
        ],
    },
    {
        slug: "valheim-midgard",
        name: "Valheim — Midgard",
        gameId: "valheim",
        summary:
            "Ancien monde Valheim, tous les boss vaincus. Serveur arrêté en fin de saison.",
        description:
            "Première aventure Valheim du groupe. Archivée après avoir bouclé le contenu.",
        startedAt: "2025-06-01",
        endedAt: "2025-11-15",
        archived: true,
        tags: ["coop", "viking", "archive"],
    },
    {
        slug: "rust-vanilla-s1",
        name: "Rust — Wipe Saison 1",
        gameId: "rust",
        summary:
            "Serveur Rust vanilla, première saison. Wipe final effectué et serveur retiré.",
        description:
            "Saison Rust vanilla entre amis, PvP. Retiré après le wipe de fin de saison.",
        startedAt: "2025-10-05",
        endedAt: "2026-01-10",
        archived: true,
        tags: ["pvp", "vanilla", "archive"],
    },
];
