import type { CardinalityEnd } from "../types/diagram";

export function markerIdFor(end: CardinalityEnd): string {
  return `erd-crowsfoot-${end.multiplicity}-${end.optionality}`;
}

export function markerUrlFor(end: CardinalityEnd): string {
  return `url(#${markerIdFor(end)})`;
}
