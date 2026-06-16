export const DEFAULT_MAP_CENTER = {
  latitude: 23.8103,
  longitude: 90.4125,
} as const;

export const DEFAULT_MAP_ZOOM = 13;

export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

export function parseCoordinate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasMapCoordinates(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
) {
  return parseCoordinate(latitude) !== null && parseCoordinate(longitude) !== null;
}
