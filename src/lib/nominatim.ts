import type { MapCoordinates } from "@/lib/mapDefaults";

export type PlaceSearchResult = MapCoordinates & {
  place_name: string;
};

type NominatimSearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type NominatimReverseResult = {
  display_name: string;
};

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "GroupManagementApp/1.0",
};

function shortPlaceName(displayName: string) {
  const parts = displayName.split(",").map((part) => part.trim());
  if (parts.length <= 2) {
    return displayName;
  }
  return parts.slice(0, 2).join(", ");
}

export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "6",
    addressdetails: "0",
    countrycodes: "bd",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: NOMINATIM_HEADERS },
  );

  if (!response.ok) {
    throw new Error("Could not search places.");
  }

  const results = (await response.json()) as NominatimSearchResult[];
  return results.map((result) => ({
    place_name: shortPlaceName(result.display_name),
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
  }));
}

export async function geocodePlaceName(
  placeName: string,
): Promise<PlaceSearchResult | null> {
  const results = await searchPlaces(placeName);
  return results[0] ?? null;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    { headers: NOMINATIM_HEADERS },
  );

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as NominatimReverseResult;
  return shortPlaceName(result.display_name);
}
