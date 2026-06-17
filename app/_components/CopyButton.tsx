"use client";

import { useState } from "react";

/**
 * Copies `value` to the clipboard on click and shows a brief "copied" state.
 * Renders `label` (or `value`) as the visible text; style via `className`.
 */
export function CopyButton({
  value,
  label,
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure origin); fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copier l'adresse"
      aria-label={`Copier ${value}`}
      className={`group inline-flex items-center gap-2 font-mono transition-colors ${className}`}
    >
      <span className="truncate">{label ?? value}</span>
      <span
        className={`shrink-0 text-xs transition-colors ${
          copied ? "text-accent" : "text-muted group-hover:text-fg"
        }`}
      >
        {copied ? "✓ copié" : "⧉ copier"}
      </span>
    </button>
  );
}
