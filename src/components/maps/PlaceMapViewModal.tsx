"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

import { FuturisticMapPin } from "@/components/maps/FuturisticMapPin";
import { setupLeafletIcons } from "@/components/maps/leafletSetup";
import { Modal } from "@/components/ui/Modal";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  hasMapCoordinates,
  parseCoordinate,
} from "@/lib/mapDefaults";
import { geocodePlaceName } from "@/lib/nominatim";

import "leaflet/dist/leaflet.css";

type PlaceMapViewModalProps = {
  open: boolean;
  onClose: () => void;
  placeName: string;
  placeLatitude: string | number | null;
  placeLongitude: string | number | null;
};

export function PlaceMapViewModal({
  open,
  onClose,
  placeName,
  placeLatitude,
  placeLongitude,
}: PlaceMapViewModalProps) {
  const [resolvedLatitude, setResolvedLatitude] = useState<number | null>(
    parseCoordinate(placeLatitude),
  );
  const [resolvedLongitude, setResolvedLongitude] = useState<number | null>(
    parseCoordinate(placeLongitude),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string>();

  useEffect(() => {
    setupLeafletIcons();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const latitude = parseCoordinate(placeLatitude);
    const longitude = parseCoordinate(placeLongitude);

    if (latitude !== null && longitude !== null) {
      setResolvedLatitude(latitude);
      setResolvedLongitude(longitude);
      setLookupError(undefined);
      return;
    }

    let cancelled = false;

    const lookupPlace = async () => {
      setIsLoading(true);
      setLookupError(undefined);
      try {
        const result = await geocodePlaceName(placeName);
        if (cancelled) {
          return;
        }
        if (!result) {
          setResolvedLatitude(null);
          setResolvedLongitude(null);
          setLookupError("Could not locate this place on the map.");
          return;
        }
        setResolvedLatitude(result.latitude);
        setResolvedLongitude(result.longitude);
      } catch {
        if (!cancelled) {
          setLookupError("Could not locate this place on the map.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void lookupPlace();

    return () => {
      cancelled = true;
    };
  }, [open, placeLatitude, placeLongitude, placeName]);

  const mapCenter = useMemo<LatLngExpression>(() => {
    if (resolvedLatitude !== null && resolvedLongitude !== null) {
      return [resolvedLatitude, resolvedLongitude];
    }
    return [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];
  }, [resolvedLatitude, resolvedLongitude]);

  const mapsUrl =
    resolvedLatitude !== null && resolvedLongitude !== null
      ? `https://www.openstreetmap.org/?mlat=${resolvedLatitude}&mlon=${resolvedLongitude}#map=${DEFAULT_MAP_ZOOM}/${resolvedLatitude}/${resolvedLongitude}`
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={placeName}
      description="Event location"
      className="max-w-3xl"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-theme bg-panel">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        ) : lookupError ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-theme bg-panel px-6 text-center text-sm text-muted">
            {lookupError}
          </div>
        ) : (
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
            </MapContainer>
            {resolvedLatitude !== null && resolvedLongitude !== null && (
              <div className="pointer-events-none absolute inset-0 z-[1000]">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                  <FuturisticMapPin />
                </div>
              </div>
            )}
          </div>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-accent transition hover:text-heading"
          >
            Open in OpenStreetMap
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {!hasMapCoordinates(placeLatitude, placeLongitude) &&
          resolvedLatitude !== null &&
          !lookupError &&
          !isLoading && (
          <p className="text-xs text-muted">
            This event was saved without map coordinates. Showing an approximate
            location from the place name.
          </p>
        )}
      </div>
    </Modal>
  );
}
