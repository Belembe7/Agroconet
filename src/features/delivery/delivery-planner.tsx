"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Route, CheckCircle2 } from "lucide-react";
import { InteractiveRouteMap } from "@/features/delivery/interactive-route-map";
import {
  deliveryStateLabels,
  type DeliveryMapItem,
  type MapPoint,
  type RoadRoute,
} from "@/features/delivery/route-types";
import { browserApi } from "@/lib/browser-api";

export function DeliveryPlanner() {
  const [deliveries, setDeliveries] = useState<DeliveryMapItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState<MapPoint | null>(null);
  const [destination, setDestination] = useState<MapPoint | null>(null);
  const [pendingDestination, setPendingDestination] = useState<MapPoint | null>(
    null,
  );
  const [pendingOrigin, setPendingOrigin] = useState<MapPoint | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [mode, setMode] = useState<"origin" | "destination">("origin");
  const [route, setRoute] = useState<RoadRoute | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selected = deliveries.find((row) => row.id === selectedId);
  const routeController = useRef<AbortController | null>(null);
  const selectedIdRef = useRef("");
  const initialized = useRef(false);
  const refresh = useCallback(async () => {
    const data = await browserApi<{ deliveries: DeliveryMapItem[] }>(
      "/api/entregas",
    );
    setDeliveries(data.deliveries);
    setLoading(false);
    if (!initialized.current) {
      initialized.current = true;
      const requested = new URLSearchParams(window.location.search).get(
        "entrega",
      );
      const initial =
        data.deliveries.find((row) => row.id === requested) ??
        data.deliveries.find((row) => row.routeActive);
      if (initial) {
        selectedIdRef.current = initial.id;
        setSelectedId(initial.id);
        setMode("destination");
      }
    }
    const current = data.deliveries.find(
      (row) => row.id === selectedIdRef.current,
    );
    if (current && !current.routeActive) {
      routeController.current?.abort();
      setRoute(null);
      setPendingDestination(null);
      setPendingOrigin(null);
      setConfirmationCode("");
      setBusy(false);
      setNotice(
        current.status === "DELIVERED"
          ? "Entrega concluída. O percurso foi retirado do mapa."
          : "Esta entrega já não tem um percurso activo.",
      );
    }
    return data.deliveries;
  }, []);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const update = async () => {
      try {
        if (alive) await refresh();
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
          setLoading(false);
        }
      } finally {
        if (alive) timer = setTimeout(update, 5000);
      }
    };
    void update();
    return () => {
      alive = false;
      clearTimeout(timer);
      routeController.current?.abort();
    };
  }, [refresh]);
  const fetchRoute = useCallback(
    async (data: {
      deliveryId?: string;
      origin?: MapPoint;
      destination?: MapPoint;
    }) => {
      routeController.current?.abort();
      const controller = new AbortController();
      routeController.current = controller;
      setRoute(null);
      setBusy(true);
      setError("");
      try {
        const result = await browserApi<{ route: RoadRoute | null }>(
          "/api/entregas/rota",
          {
            method: "POST",
            body: JSON.stringify(data),
            signal: controller.signal,
          },
        );
        if (!controller.signal.aborted) setRoute(result.route);
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    },
    [],
  );
  const autoRouteId =
    !preview && selected?.routeActive && selected.origin && selected.destination
      ? selected.id
      : null;
  const autoRouteKey = autoRouteId
    ? JSON.stringify([selected?.origin, selected?.destination])
    : "";
  useEffect(() => {
    if (!autoRouteId) return;
    const timer = setTimeout(
      () => void fetchRoute({ deliveryId: autoRouteId }),
      0,
    );
    return () => {
      clearTimeout(timer);
      routeController.current?.abort();
    };
  }, [autoRouteId, autoRouteKey, fetchRoute]);

  function selectDelivery(id: string) {
    if (id && id === selectedIdRef.current) return;
    selectedIdRef.current = id;
    routeController.current?.abort();
    setBusy(false);
    setSelectedId(id);
    setPreview(!id);
    setRoute(null);
    setPendingDestination(null);
    setPendingOrigin(null);
    setConfirmationCode("");
    setError("");
    setNotice("");
    setOrigin(null);
    setDestination(null);
    setMode(id ? "destination" : "origin");
  }
  function mark(point: MapPoint) {
    routeController.current?.abort();
    setBusy(false);
    setRoute(null);
    setError("");
    setNotice("");
    if (!selected) {
      setPreview(true);
      setRoute(null);
      if (mode === "origin") {
        setOrigin(point);
        setMode("destination");
      } else setDestination(point);
    } else if (mode === "origin" && selected.canEditOrigin) {
      setPendingOrigin(point);
    } else if (mode === "destination" && selected.canEdit) {
      setPendingDestination(point);
    }
  }
  async function saveDestination() {
    const point = mode === "origin" ? pendingOrigin : pendingDestination;
    if (!selected || !point) return;
    setBusy(true);
    setError("");
    try {
      await browserApi(
        mode === "origin" ? "/api/entregas/partida" : "/api/entregas",
        {
          method: "POST",
          body: JSON.stringify({ deliveryId: selected.id, ...point }),
        },
      );
      await refresh();
      setPendingDestination(null);
      setPendingOrigin(null);
      setNotice("Localização guardada para esta entrega.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const active = selected?.routeActive ?? false;
  const displayOrigin = selected
    ? active
      ? (pendingOrigin ?? selected.origin)
      : null
    : origin;
  const displayDestination = selected
    ? active
      ? (pendingDestination ?? selected.destination)
      : null
    : destination;
  return (
    <section className="delivery-planner">
      <header className="service-page-header">
        <p className="guide-eyebrow">AGROCONET · ENTREGAS</p>
        <h1>O caminho até si.</h1>
        <p>Marque o destino no mapa e acompanhe o percurso da sua entrega.</p>
      </header>
      <div className="delivery-planner-grid">
        <aside className="delivery-planner-controls">
          <label htmlFor="delivery-choice">Pedido / entrega</label>
          <select
            id="delivery-choice"
            value={selectedId}
            onChange={(e) => selectDelivery(e.target.value)}
            disabled={loading || busy}
          >
            <option value="">Simular um percurso</option>
            {deliveries.map((row) => (
              <option key={row.id} value={row.id}>
                {row.number} · {row.seller} · {deliveryStateLabels[row.status]}
              </option>
            ))}
          </select>
          {loading && <p role="status">A carregar entregas…</p>}
          {selected ? (
            <>
              <p className="delivery-status">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {deliveryStateLabels[selected.status]}
              </p>
              {selected.routeActive && (
                <p className="service-muted">
                  {selected.canEdit
                    ? "Clique no mapa para marcar o destino e confirme a localização."
                    : "O destino está confirmado. Acompanhe o percurso até à entrega."}
                </p>
              )}
              {selected.routeActive && !selected.origin && (
                <p className="service-muted">
                  A localização do vendedor ainda não está registada.{" "}
                  <Link href="/apoio" className="underline">
                    Contactar apoio
                  </Link>
                </p>
              )}
              {selected.canEditOrigin && (
                <div className="map-selection-modes">
                  <button
                    className={mode === "origin" ? "active" : ""}
                    aria-pressed={mode === "origin"}
                    onClick={() => {
                      setMode("origin");
                      setPendingDestination(null);
                    }}
                  >
                    Marcar partida
                  </button>
                  {selected.canEdit && (
                    <button
                      className={mode === "destination" ? "active" : ""}
                      aria-pressed={mode === "destination"}
                      onClick={() => {
                        setMode("destination");
                        setPendingOrigin(null);
                      }}
                    >
                      Marcar destino
                    </button>
                  )}
                </div>
              )}
              {(pendingDestination || pendingOrigin) && (
                <button
                  className="service-button"
                  disabled={busy}
                  onClick={() => void saveDestination()}
                >
                  <MapPin className="size-4" />
                  Confirmar localização
                </button>
              )}
              {selected.canConfirm && (
                <>
                  <button
                    className="service-button secondary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        const result = await browserApi<{ code: string }>(
                          "/api/entregas/codigo",
                          {
                            method: "POST",
                            body: JSON.stringify({ deliveryId: selected.id }),
                          },
                        );
                        setConfirmationCode(result.code);
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Gerar código de recepção
                  </button>
                  {confirmationCode && (
                    <p className="service-notice" role="status">
                      Código: <strong>{confirmationCode}</strong>. Partilhe
                      apenas com o entregador ao receber a encomenda.
                    </p>
                  )}
                </>
              )}
              {selected.routeActive &&
                selected.origin &&
                selected.destination &&
                !route && (
                  <button
                    className="service-button secondary"
                    disabled={busy}
                    onClick={() => void fetchRoute({ deliveryId: selected.id })}
                  >
                    Traçar novamente
                  </button>
                )}
            </>
          ) : (
            <>
              <p className="service-muted">
                {!deliveries.length
                  ? "Ainda não tem entregas. Experimente o mapa seleccionando a partida e o destino. Quando tiver um pedido, seleccione-o acima para guardar a localização."
                  : "Esta é uma simulação. Seleccione uma entrega acima para guardar o seu destino."}
              </p>
              <div className="map-selection-modes">
                <button
                  className={mode === "origin" ? "active" : ""}
                  aria-pressed={mode === "origin"}
                  onClick={() => setMode("origin")}
                >
                  Marcar partida
                </button>
                <button
                  className={mode === "destination" ? "active" : ""}
                  aria-pressed={mode === "destination"}
                  onClick={() => setMode("destination")}
                >
                  Marcar destino
                </button>
              </div>
              <button
                className="service-button"
                disabled={busy || !origin || !destination}
                onClick={() => {
                  if (origin && destination)
                    void fetchRoute({ origin, destination });
                }}
              >
                <Route className="size-4" />
                {busy ? "A calcular…" : "Traçar rota por estrada"}
              </button>
              <button
                className="service-button secondary"
                disabled={busy}
                onClick={() => selectDelivery("")}
              >
                Limpar percurso
              </button>
            </>
          )}
          {displayOrigin && (
            <p className="map-coordinate">
              <strong>Partida</strong>
              {displayOrigin.latitude.toFixed(5)},{" "}
              {displayOrigin.longitude.toFixed(5)}
            </p>
          )}
          {displayDestination && (
            <p className="map-coordinate">
              <strong>Destino</strong>
              {displayDestination.latitude.toFixed(5)},{" "}
              {displayDestination.longitude.toFixed(5)}
            </p>
          )}
          {route && (!selected || active) && (
            <div className="route-summary" role="status">
              <strong>
                {(route.distance / 1000).toFixed(1)} km · ~
                {Math.max(1, Math.round(route.duration / 60))} min
              </strong>
              <p>
                Estimativa de condução. O prazo de entrega é confirmado pela
                equipa.
              </p>
            </div>
          )}
          {notice && (
            <p role="status" className="service-notice">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="service-error">
              {error}
            </p>
          )}
        </aside>
        <div className="delivery-planner-map">
          <InteractiveRouteMap
            origin={displayOrigin}
            destination={displayDestination}
            route={
              !selected || active
                ? pendingDestination || pendingOrigin
                  ? null
                  : route
                : null
            }
            editable={
              !selected ||
              (mode === "origin" ? selected.canEditOrigin : selected.canEdit)
            }
            onSelect={mark}
          />
          <p className="service-muted">
            A rota deixa de aparecer automaticamente quando a entrega é
            confirmada como concluída.
          </p>
        </div>
      </div>
    </section>
  );
}
