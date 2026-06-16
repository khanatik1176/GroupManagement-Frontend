"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

import { setupLeafletIcons } from "@/components/maps/leafletSetup";
import { FuturisticMapPin } from "@/components/maps/FuturisticMapPin";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  parseCoordinate,
} from "@/lib/mapDefaults";
import { reverseGeocode, searchPlaces, type PlaceSearchResult } from "@/lib/nominatim";
import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

export type PlaceSelection = {
  place_name: string;
  place_latitude: number | null;
  place_longitude: number | null;
};

type PlaceMapPickerProps = {
  value: PlaceSelection;
  onChange: (value: PlaceSelection) => void;
  className?: string;
};

type FlyTarget = {
  latitude: number;
  longitude: number;
  token: number;
};

function MapFlyTo({ target }: { target: FlyTarget | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) {
      return;
    }
    map.flyTo([target.latitude, target.longitude], DEFAULT_MAP_ZOOM, {
      duration: 0.55,
    });
  }, [map, target]);

  return null;
}

function MapCenterTracker({
  onCenterChange,
  onMoveStart,
  onMoveEnd,
  skipMoveRef,
}: {
  onCenterChange: (latitude: number, longitude: number) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  skipMoveRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const hasInteractedRef = useRef(false);

  useMapEvents({
    movestart() {
      hasInteractedRef.current = true;
      onMoveStart();
    },
    moveend() {
      onMoveEnd();
      if (skipMoveRef.current) {
        skipMoveRef.current = false;
        return;
      }
      if (!hasInteractedRef.current) {
        return;
      }
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
  });

  return null;
}

function CenterPinOverlay({ isMoving }: { isMoving: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1000]">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <FuturisticMapPin isMoving={isMoving} />
      </div>
    </div>
  );
}

export function PlaceMapPicker({ value, onChange, className }: PlaceMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [searchError, setSearchError] = useState<string>();
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [displayAddress, setDisplayAddress] = useState(value.place_name);

  const skipMoveRef = useRef(false);
  const resolveTimeoutRef = useRef<number | null>(null);
  const resolveRequestRef = useRef(0);

  useEffect(() => {
    setupLeafletIcons();
  }, []);

  useEffect(() => {
    setDisplayAddress(value.place_name);
  }, [value.place_name]);

  const latitude = parseCoordinate(value.place_latitude);
  const longitude = parseCoordinate(value.place_longitude);

  const mapCenter: LatLngExpression =
    latitude !== null && longitude !== null
      ? [latitude, longitude]
      : [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];

  const flyTo = useCallback((nextLatitude: number, nextLongitude: number) => {
    skipMoveRef.current = true;
    setFlyTarget({
      latitude: nextLatitude,
      longitude: nextLongitude,
      token: Date.now(),
    });
  }, []);

  const resolveCenter = useCallback(
    (nextLatitude: number, nextLongitude: number) => {
      if (resolveTimeoutRef.current !== null) {
        window.clearTimeout(resolveTimeoutRef.current);
      }

      setIsMapMoving(true);
      setIsResolving(true);

      resolveTimeoutRef.current = window.setTimeout(async () => {
        const requestId = ++resolveRequestRef.current;

        try {
          const resolvedName = await reverseGeocode(nextLatitude, nextLongitude);
          if (requestId !== resolveRequestRef.current) {
            return;
          }

          const placeName = resolvedName ?? value.place_name;
          setDisplayAddress(placeName || "Selected location");
          onChange({
            place_name: placeName || value.place_name || "Selected location",
            place_latitude: nextLatitude,
            place_longitude: nextLongitude,
          });
        } finally {
          if (requestId === resolveRequestRef.current) {
            setIsResolving(false);
          }
        }
      }, 450);
    },
    [onChange, value.place_name],
  );

  const handleMoveStart = useCallback(() => {
    setIsMapMoving(true);
  }, []);

  const handleMoveEnd = useCallback(() => {
    setIsMapMoving(false);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchError(undefined);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(undefined);
      try {
        const results = await searchPlaces(trimmed);
        setSearchResults(results);
      } catch {
        setSearchError("Could not search places.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const selectSearchResult = (result: PlaceSearchResult) => {
    setSearchQuery("");
    setSearchResults([]);
    setDisplayAddress(result.place_name);
    onChange({
      place_name: result.place_name,
      place_latitude: result.latitude,
      place_longitude: result.longitude,
    });
    flyTo(result.latitude, result.longitude);
  };

  useEffect(() => {
    return () => {
      if (resolveTimeoutRef.current !== null) {
        window.clearTimeout(resolveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl border border-theme bg-panel px-3 py-2.5">
        <p className="text-xs uppercase tracking-wide text-muted">Selected location</p>
        <div className="mt-1 flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="min-w-0 text-sm font-medium text-heading">
            {displayAddress || "Move the map to pick a location"}
          </p>
          {isResolving && (
            <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin text-muted" />
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search for a place..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
        {searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-theme bg-elevated shadow-lg">
            {searchResults.map((result) => (
              <button
                key={`${result.latitude}-${result.longitude}-${result.place_name}`}
                type="button"
                onClick={() => selectSearchResult(result)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-body transition hover:bg-panel"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{result.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searchError && <p className="text-xs text-[var(--danger)]">{searchError}</p>}

      <div className="relative overflow-hidden rounded-xl border border-theme">
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_MAP_ZOOM}
          scrollWheelZoom
          className="h-72 w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo target={flyTarget} />
          <MapCenterTracker
            onCenterChange={resolveCenter}
            onMoveStart={handleMoveStart}
            onMoveEnd={handleMoveEnd}
            skipMoveRef={skipMoveRef}
          />
        </MapContainer>
        <CenterPinOverlay isMoving={isMapMoving || isResolving} />
      </div>

      <p className="text-xs text-muted">
        Drag the map to position the pin on your event location — just like Uber.
        Search to jump somewhere, then fine-tune by moving the map.
      </p>
    </div>
  );
}
