import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "kidzopedia:scroll-positions";

type ScrollMap = Record<string, number>;

const readMap = (): ScrollMap => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") as ScrollMap;
  } catch {
    return {};
  }
};
const writeMap = (m: ScrollMap) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

/**
 * On PUSH/REPLACE: scroll to top.
 * On POP (back/forward): restore the previously saved scroll position for that location key.
 * Saves scroll position before each navigation.
 */
export const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  // Save scroll position for the current location before unmount/navigation
  useEffect(() => {
    const key = location.key || location.pathname;
    const onSave = () => {
      const map = readMap();
      map[key] = window.scrollY;
      writeMap(map);
    };
    window.addEventListener("beforeunload", onSave);
    return () => {
      onSave();
      window.removeEventListener("beforeunload", onSave);
    };
  }, [location.key, location.pathname]);

  // Apply scroll on navigation
  useEffect(() => {
    const key = location.key || location.pathname;
    if (navType === "POP") {
      const map = readMap();
      const y = map[key] ?? 0;
      // Wait a frame so the new page has rendered
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [location.key, location.pathname, navType]);

  return null;
};

export default ScrollToTop;
