# Images de fond des jeux

Chaque fichier `<gameId>.jpg` ici est utilisé comme **image de fond** pour les
serveurs de ce jeu (bannière du serveur à la une, cartes, grille « Jeux
proposés »).

Les images actuelles sont des **placeholders**. Pour mettre tes vraies images,
remplace simplement le fichier correspondant — garde le même nom :

| Fichier                   | Jeu                  |
| ------------------------- | -------------------- |
| `minecraft.jpg`           | Minecraft (Java)     |
| `minecraft-bedrock.jpg`   | Minecraft (Bedrock)  |
| `valheim.jpg`             | Valheim              |
| `ark.jpg`                 | ARK: Survival        |
| `cs2.jpg`                 | Counter-Strike 2     |
| `rust.jpg`                | Rust                 |
| `gmod.jpg`                | Garry's Mod          |
| `terraria.jpg`            | Terraria             |
| `factorio.jpg`            | Factorio             |

Les `gameId` sont définis dans `lib/games.ts` (champ `background`). Pour ajouter
un nouveau jeu, ajoute son entrée là-bas avec `background: '/games/<id>.jpg'` et
dépose l'image ici.

## Conseils

- Format **paysage** (≈ 16/9), idéalement **1600×900** ou plus.
- Une image plutôt **sombre / contrastée** rend mieux : un dégradé vers le bas
  est appliqué par-dessus pour garder le texte lisible.
- Un serveur peut surcharger ce fond avec ses propres visuels via le champ
  `images` (fichiers dans `public/servers/<slug>/`).
