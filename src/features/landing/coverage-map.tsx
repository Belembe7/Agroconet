"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

type DeliveryMapZone = {
  id: string;
  name: string;
  areas: string[];
};

const zoneCoordinates: Record<string, { latitude: number; longitude: number }> =
  {
    maputo: { latitude: -25.9692, longitude: 32.5732 },
    katembe: { latitude: -26.0035, longitude: 32.5875 },
    matola: { latitude: -25.9622, longitude: 32.4589 },
  };

function getZoneCoordinates(name?: string) {
  const normalizedName =
    name
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() ?? "";

  if (normalizedName.includes("matola")) return zoneCoordinates.matola;
  if (
    normalizedName.includes("katembe") ||
    normalizedName.includes("catembe")
  ) {
    return zoneCoordinates.katembe;
  }
  return zoneCoordinates.maputo;
}

export function DeliveryCoverageMap({ zones }: { zones: DeliveryMapZone[] }) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? "");
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);
  const coordinates = getZoneCoordinates(selectedZone?.name);
  const embedUrl = new URL("https://www.openstreetmap.org/export/embed.html");
  embedUrl.searchParams.set("bbox", "32.32,-26.13,32.83,-25.73");
  embedUrl.searchParams.set("layer", "mapnik");
  embedUrl.searchParams.set(
    "marker",
    `${coordinates.latitude},${coordinates.longitude}`,
  );

  return (
    <div className="delivery-map">
      <div className="delivery-map-heading">
        <div>
          <p className="delivery-map-eyebrow">MAPA DE COBERTURA</p>
          <h3>{selectedZone?.name ?? "Maputo e arredores"}</h3>
        </div>
      </div>

      {zones.length > 0 ? (
        <div className="delivery-map-zones" aria-label="Zonas de entrega">
          {zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              aria-pressed={selectedZoneId === zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
            >
              <MapPin aria-hidden="true" className="size-3.5" />
              {zone.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="delivery-map-empty">
          Não há zonas de entrega activas para apresentar.
        </p>
      )}

      <div className="delivery-map-frame">
        <iframe
          key={selectedZone?.id ?? "maputo"}
          title={`Mapa da zona ${selectedZone?.name ?? "de Maputo"}`}
          src={embedUrl.toString()}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
        <span className="delivery-map-caption">
          <MapPin aria-hidden="true" className="size-3.5" />
          {selectedZone?.name ?? "Maputo e arredores"}
        </span>
      </div>

      <div className="delivery-map-footer">
        <span>
          {selectedZone?.areas.length
            ? `Áreas: ${selectedZone.areas.join(", ")}`
            : "Entregas nas zonas activas, mediante confirmação."}
        </span>
        <span>© OpenStreetMap</span>
      </div>
    </div>
  );
}
