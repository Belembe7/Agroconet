"use client";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint, RoadRoute } from "@/features/delivery/route-types";

export function InteractiveRouteMap({
  origin,
  destination,
  route,
  onSelect,
  editable,
}: {
  origin: MapPoint | null;
  destination: MapPoint | null;
  route: RoadRoute | null;
  onSelect: (point: MapPoint) => void;
  editable: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layers = useRef<Leaflet.LayerGroup | null>(null);
  const library = useRef<typeof Leaflet | null>(null);
  const callback = useRef(onSelect);
  const canSelect = useRef(editable);
  const [ready, setReady] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    callback.current = onSelect;
    canSelect.current = editable;
  }, [onSelect, editable]);
  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (cancelled || !container.current) return;
        library.current = L;
        const instance = L.map(container.current, {
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
        }).setView([-25.975, 32.53], 11);
        map.current = instance;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(instance);
        layers.current = L.layerGroup().addTo(instance);
        instance.on("click", (event: Leaflet.LeafletMouseEvent) => {
          if (canSelect.current)
            callback.current({
              latitude: event.latlng.lat,
              longitude: event.latlng.lng,
            });
        });
        resize = new ResizeObserver(() => {
          if (map.current === instance) instance.invalidateSize();
        });
        resize.observe(container.current);
        setReady((current) => current + 1);
      })
      .catch(() =>
        setError("Não foi possível carregar o mapa. Actualize a página."),
      );
    return () => {
      cancelled = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      layers.current = null;
    };
  }, []);
  const originLatitude = origin?.latitude;
  const originLongitude = origin?.longitude;
  const destinationLatitude = destination?.latitude;
  const destinationLongitude = destination?.longitude;
  useEffect(() => {
    const origin =
      originLatitude !== undefined && originLongitude !== undefined
        ? { latitude: originLatitude, longitude: originLongitude }
        : null;
    const destination =
      destinationLatitude !== undefined && destinationLongitude !== undefined
        ? { latitude: destinationLatitude, longitude: destinationLongitude }
        : null;
    const L = library.current;
    const instance = map.current;
    const group = layers.current;
    if (!ready || !L || !instance || !group) return;
    group.clearLayers();
    if (route) {
      const line: Leaflet.LatLngTuple[] = route.coordinates.map(
        ([longitude, latitude]) => [latitude, longitude],
      );
      L.polyline(line, { color: "#fff", weight: 9, opacity: 0.9 }).addTo(group);
      L.polyline(line, { color: "#185d3e", weight: 5 }).addTo(group);
      instance.fitBounds(L.latLngBounds(line), {
        animate: false,
        padding: [35, 35],
        maxZoom: 15,
      });
    }
    for (const [point, label, color] of [
      [origin, "Partida", "#185d3e"],
      [destination, "Destino", "#d16b22"],
    ] as const) {
      if (point)
        L.circleMarker([point.latitude, point.longitude], {
          radius: 9,
          color: "#fff",
          weight: 3,
          fillColor: color,
          fillOpacity: 1,
        })
          .bindTooltip(label)
          .addTo(group);
    }
    if (!route && (origin || destination)) {
      const points = [origin, destination]
        .filter((point): point is MapPoint => point !== null)
        .map((point) => L.latLng(point.latitude, point.longitude));
      instance.fitBounds(L.latLngBounds(points), {
        animate: false,
        padding: [45, 45],
        maxZoom: 14,
      });
    }
  }, [
    ready,
    originLatitude,
    originLongitude,
    destinationLatitude,
    destinationLongitude,
    route,
  ]);
  return (
    <div className="interactive-map-wrap">
      {error && (
        <p role="alert" className="service-error">
          {error}
        </p>
      )}
      <div
        ref={container}
        className="interactive-route-map"
        role="region"
        aria-label="Mapa para seleccionar a localização e visualizar a rota"
      />
      {editable && (
        <button
          type="button"
          className="map-center-button"
          disabled={!ready}
          onClick={() => {
            const center = map.current?.getCenter();
            if (center)
              onSelect({ latitude: center.lat, longitude: center.lng });
          }}
        >
          Marcar o centro do mapa
        </button>
      )}
    </div>
  );
}
