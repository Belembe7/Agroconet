"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

type DeliveryMapZone = {
  id: string;
  name: string;
  areas: string[];
};

export function GoogleDeliveryMap({
  zones,
  apiKey,
}: {
  zones: DeliveryMapZone[];
  apiKey?: string;
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? "");
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId);
  const location = selectedZone
    ? `${selectedZone.areas[0] ?? selectedZone.name}, ${selectedZone.name}, Maputo, Mozambique`
    : "Maputo, Mozambique";
  const embedUrl = new URL(
    apiKey
      ? "https://www.google.com/maps/embed/v1/place"
      : "https://maps.google.com/maps",
  );
  if (apiKey) {
    embedUrl.searchParams.set("key", apiKey);
    embedUrl.searchParams.set("q", location);
    embedUrl.searchParams.set("zoom", "11");
  } else {
    embedUrl.searchParams.set("hl", "pt");
    embedUrl.searchParams.set("q", location);
    embedUrl.searchParams.set("z", "11");
    embedUrl.searchParams.set("ie", "UTF8");
    embedUrl.searchParams.set("iwloc", "B");
    embedUrl.searchParams.set("output", "embed");
  }

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
        {apiKey ? (
          <>
            <iframe
              key={location}
              title={`Mapa Google da zona ${selectedZone?.name ?? "de Maputo"}`}
              src={embedUrl.toString()}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <span className="delivery-map-caption">
              <MapPin aria-hidden="true" className="size-3.5" />
              Uma ligação que vai mais longe
            </span>
          </>
        ) : (
          <div className="delivery-map-setup" role="status">
            <MapPin aria-hidden="true" className="size-8" />
            <h4>Mapa de cobertura indisponível</h4>
            <p>
              As zonas continuam visíveis acima. O mapa será apresentado aqui
              assim que a integração estiver configurada.
            </p>
          </div>
        )}
      </div>

      <div className="delivery-map-footer">
        <span>
          {selectedZone?.areas.length
            ? `Áreas: ${selectedZone.areas.join(", ")}`
            : "Entregas nas zonas activas, mediante confirmação."}
        </span>
        <span>Moçambique</span>
      </div>
    </div>
  );
}
