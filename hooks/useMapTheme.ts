"use client";

import { useCallback, useEffect, useState } from "react";
import type { MapThemeId } from "@/lib/mapThemes";

const STORAGE_KEY = "african_msdi_map_theme";
const DEFAULT_THEME: MapThemeId = "voyager";

export function useMapTheme() {
  const [mapTheme, setMapThemeState] = useState<MapThemeId>(DEFAULT_THEME);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as MapThemeId | null;
      if (saved) setMapThemeState(saved);
    } catch {
      // ignore storage issues
    }
  }, []);

  const setMapTheme = useCallback((theme: MapThemeId) => {
    setMapThemeState(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage issues
    }
  }, []);

  return { mapTheme, setMapTheme };
}

