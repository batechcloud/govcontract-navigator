import { useEffect, RefObject } from "react";

/**
 * Press "/" anywhere to focus the given input ref.
 * Ignores keypresses while typing in inputs/textareas/contenteditable.
 * Per PRD: keyboard shortcut "/" focuses the search bar.
 */
export function useSearchShortcut(ref: RefObject<HTMLInputElement | HTMLTextAreaElement>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ref]);
}
