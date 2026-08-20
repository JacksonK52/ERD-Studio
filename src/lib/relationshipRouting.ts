import type { DiagramTable } from "../types/diagram";
import type { HandleSide } from "./handleId";

/** Pick which side of each table an edge should leave/arrive from, based
 * on their current relative horizontal position, so relationships don't
 * default to crossing back over their own tables (masterplan Challenge 1:
 * favor readable routing over perfect routing). Shared between the live
 * canvas and the static export renderer so both route identically. */
export function pickHandleSides(
  sourceTable: DiagramTable,
  targetTable: DiagramTable,
): { sourceSide: HandleSide; targetSide: HandleSide } {
  if (sourceTable.id === targetTable.id) {
    // Self-reference (e.g. employees.manager_id -> employees.id): loop out
    // and back on the same side rather than routing all the way around
    // the table to reach an "opposite" side that doesn't really apply
    // when there's only one table involved.
    return { sourceSide: "r", targetSide: "r" };
  }
  if (sourceTable.position.x <= targetTable.position.x) {
    return { sourceSide: "r", targetSide: "l" };
  }
  return { sourceSide: "l", targetSide: "r" };
}
