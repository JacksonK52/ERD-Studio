export type HandleSide = "l" | "r";

/**
 * Handle ids are "<side>:<columnId>" — colon is outside nanoid's default
 * alphabet, so parsing back out is unambiguous.
 */
export function makeHandleId(side: HandleSide, columnId: string): string {
  return `${side}:${columnId}`;
}

export function parseHandleId(handleId: string): { side: HandleSide; columnId: string } | null {
  const side = handleId.slice(0, 1);
  if (side !== "l" && side !== "r") return null;
  if (handleId.charAt(1) !== ":") return null;
  return { side, columnId: handleId.slice(2) };
}
