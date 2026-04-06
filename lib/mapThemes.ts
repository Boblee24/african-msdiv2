export type MapThemeId = "voyager" | "light" | "dark" | "satellite";

type MapTheme = {
  label: string;
  url: string;
  attribution: string;
  background: string;
  maxZoom?: number;
};

export const MAP_THEMES: Record<MapThemeId, MapTheme> = {
  voyager: {
    label: "Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    background: "#2f3f5f",
    maxZoom: 19,
  },
  light: {
    label: "Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    background: "#d8dee6",
    maxZoom: 20,
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    background: "#101827",
    maxZoom: 20,
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    background: "#0f172a",
    maxZoom: 19,
  },
};

export const MAP_THEME_OPTIONS = (Object.keys(MAP_THEMES) as MapThemeId[]).map(
  (id) => ({ value: id, label: MAP_THEMES[id].label }),
);

