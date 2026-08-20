import type { Diagram } from "../types/diagram";
import { validateDiagram } from "./diagramValidation";

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "diagram";
}

/** Triggers a browser download of the diagram as a portable JSON file. */
export function saveProjectFile(diagram: Diagram): void {
  const json = JSON.stringify(diagram, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(diagram.meta.name)}.erd.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Opens a file picker, reads and validates the selected file, and resolves
 * with a Diagram — or rejects with a human-readable message on invalid
 * input (masterplan §21: project files are untrusted, fail gracefully).
 * Resolves to null if the user cancels the picker.
 */
export function openProjectFile(): Promise<Diagram | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }
      file
        .text()
        .then((text) => {
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            reject(new Error("That file isn't valid JSON."));
            return;
          }
          const result = validateDiagram(parsed);
          if (!result.ok) {
            reject(new Error(result.error));
            return;
          }
          resolve(result.diagram);
        })
        .catch(() => reject(new Error("Couldn't read that file.")));
    });

    // Modern browsers fire this when the picker is dismissed with no
    // selection — without it, cancelling would leave the promise pending
    // forever.
    input.addEventListener("cancel", () => {
      document.body.removeChild(input);
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
  });
}
