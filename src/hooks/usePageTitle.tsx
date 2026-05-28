import { useEffect } from "react";

/**
 * Sets document.title to "<title> – GC Navigator". Restores previous title on unmount.
 * Use on authenticated app pages where react-helmet-async is overkill.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} – GC Navigator`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
