import { useEffect, type RefObject } from "react";

export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
