/**
 * Same crow's-foot marker geometry as components/Canvas/EdgeMarkerDefs.tsx,
 * duplicated here as plain, portable SVG markup (concrete colors instead
 * of `var(--color-surface)`, since an exported file can't depend on the
 * app's stylesheet). If you change one, change the other.
 */
export const CROWSFOOT_MARKERS_SVG = `
<marker id="erd-crowsfoot-one-mandatory" viewBox="0 0 34 20" refX="32" refY="10" markerWidth="26" markerHeight="16" orient="auto-start-reverse">
  <line x1="27" y1="3" x2="27" y2="17" stroke="currentColor" stroke-width="1.5"/>
  <line x1="32" y1="3" x2="32" y2="17" stroke="currentColor" stroke-width="1.5"/>
</marker>
<marker id="erd-crowsfoot-one-optional" viewBox="0 0 34 20" refX="32" refY="10" markerWidth="26" markerHeight="16" orient="auto-start-reverse">
  <line x1="27" y1="3" x2="27" y2="17" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="12" cy="10" r="4.5" fill="#ffffff" stroke="currentColor" stroke-width="1.5"/>
</marker>
<marker id="erd-crowsfoot-many-mandatory" viewBox="0 0 34 20" refX="32" refY="10" markerWidth="26" markerHeight="16" orient="auto-start-reverse">
  <path d="M 32 10 L 20 3 M 32 10 L 20 10 M 32 10 L 20 17" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" stroke-width="1.5"/>
</marker>
<marker id="erd-crowsfoot-many-optional" viewBox="0 0 34 20" refX="32" refY="10" markerWidth="26" markerHeight="16" orient="auto-start-reverse">
  <path d="M 32 10 L 20 3 M 32 10 L 20 10 M 32 10 L 20 17" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="8" cy="10" r="4.5" fill="#ffffff" stroke="currentColor" stroke-width="1.5"/>
</marker>
`;
