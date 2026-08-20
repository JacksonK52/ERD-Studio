/**
 * Standard crow's-foot ERD symbols, one marker per (multiplicity,
 * optionality) combination:
 *   one + mandatory  -> exactly one            (double bar)
 *   one + optional   -> zero or one            (circle + bar)
 *   many + mandatory -> one or many            (crow's foot + bar)
 *   many + optional  -> zero or many           (crow's foot + circle)
 *
 * Each marker's local +x axis points toward the entity it's attached to
 * (refX sits at the entity edge); `orient="auto-start-reverse"` flips the
 * same definition automatically when used as a start marker instead of an
 * end marker, so one set of defs covers both ends of every edge.
 *
 * See lib/markerId.ts for the id/url helpers used to reference these.
 */

const MARKER_VIEWBOX = "0 0 34 20";
const MARKER_SIZE = { width: 26, height: 16 };

export function EdgeMarkerDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        {/* one + mandatory — exactly one (||) */}
        <marker
          id="erd-crowsfoot-one-mandatory"
          viewBox={MARKER_VIEWBOX}
          refX={32}
          refY={10}
          markerWidth={MARKER_SIZE.width}
          markerHeight={MARKER_SIZE.height}
          orient="auto-start-reverse"
        >
          <line x1={27} y1={3} x2={27} y2={17} stroke="currentColor" strokeWidth={1.5} />
          <line x1={32} y1={3} x2={32} y2={17} stroke="currentColor" strokeWidth={1.5} />
        </marker>

        {/* one + optional — zero or one (o|) */}
        <marker
          id="erd-crowsfoot-one-optional"
          viewBox={MARKER_VIEWBOX}
          refX={32}
          refY={10}
          markerWidth={MARKER_SIZE.width}
          markerHeight={MARKER_SIZE.height}
          orient="auto-start-reverse"
        >
          <line x1={27} y1={3} x2={27} y2={17} stroke="currentColor" strokeWidth={1.5} />
          <circle
            cx={12}
            cy={10}
            r={4.5}
            fill="var(--color-surface)"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </marker>

        {/* many + mandatory — one or many (crow's foot |) */}
        <marker
          id="erd-crowsfoot-many-mandatory"
          viewBox={MARKER_VIEWBOX}
          refX={32}
          refY={10}
          markerWidth={MARKER_SIZE.width}
          markerHeight={MARKER_SIZE.height}
          orient="auto-start-reverse"
        >
          <path
            d="M 32 10 L 20 3 M 32 10 L 20 10 M 32 10 L 20 17"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <line x1={10} y1={3} x2={10} y2={17} stroke="currentColor" strokeWidth={1.5} />
        </marker>

        {/* many + optional — zero or many (crow's foot o) */}
        <marker
          id="erd-crowsfoot-many-optional"
          viewBox={MARKER_VIEWBOX}
          refX={32}
          refY={10}
          markerWidth={MARKER_SIZE.width}
          markerHeight={MARKER_SIZE.height}
          orient="auto-start-reverse"
        >
          <path
            d="M 32 10 L 20 3 M 32 10 L 20 10 M 32 10 L 20 17"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <circle
            cx={8}
            cy={10}
            r={4.5}
            fill="var(--color-surface)"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </marker>
      </defs>
    </svg>
  );
}
