/**
 * Decorative ambient background: a few oversized, heavily-blurred glows that
 * drift slowly through the dark. Pure CSS (see `.ambient` in globals.css) —
 * only `transform` is animated, so the work stays on the compositor with no
 * layout/paint per frame and zero client JS. Honoured down to
 * `prefers-reduced-motion`. Purely decorative, so hidden from the a11y tree.
 */
export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="ambient__glow ambient__glow--1" />
      <span className="ambient__glow ambient__glow--2" />
      <span className="ambient__glow ambient__glow--3" />
    </div>
  );
}
