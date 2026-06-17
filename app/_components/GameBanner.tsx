import Image from "next/image";
import type { GameInfo } from "@/lib/types";

/**
 * Banner for a server. Prefers the server's own image, then the game's
 * background art, and finally a gradient tinted with the game's accent color.
 */
export function GameBanner({
  game,
  image,
  className = "",
}: {
  game: GameInfo;
  image?: string;
  className?: string;
}) {
  const src = image ?? game.background;
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{
        backgroundImage: `radial-gradient(120% 120% at 30% 0%, ${game.accent}55, transparent 60%), linear-gradient(135deg, ${game.accent}22, transparent)`,
      }}
    >
      <span className="text-4xl opacity-80 drop-shadow">{game.emoji}</span>
    </div>
  );
}
