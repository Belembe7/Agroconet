export type MapPoint = { latitude: number; longitude: number };
export type DeliveryMapItem = {
  id: string;
  number: string;
  seller: string;
  status: string;
  origin: MapPoint | null;
  destination: MapPoint | null;
  routeActive: boolean;
  canEdit: boolean;
  canConfirm: boolean;
  canEditOrigin: boolean;
};
export type RoadRoute = {
  coordinates: [number, number][];
  distance: number;
  duration: number;
};
export const deliveryStateLabels: Record<string, string> = {
  UNASSIGNED: "A aguardar entregador",
  ASSIGNED: "Entregador atribuído",
  ACCEPTED: "Entrega aceite",
  EN_ROUTE_TO_PICKUP: "A caminho do vendedor",
  PICKED_UP: "Recolhida",
  EN_ROUTE_TO_CUSTOMER: "A caminho do destino",
  DELIVERED: "Entregue",
  FAILED: "Entrega não concluída",
  CANCELLED: "Cancelada",
};
export const hasActiveRoute = (status: string) =>
  !["DELIVERED", "CANCELLED", "FAILED"].includes(status);
export const editableDeliveryStates = [
  "UNASSIGNED",
  "ASSIGNED",
  "ACCEPTED",
  "EN_ROUTE_TO_PICKUP",
];
export function pointFromSnapshot(value: unknown): MapPoint | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    ![row.latitude, row.longitude].every(
      (v) =>
        (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) &&
        Number.isFinite(Number(v)),
    )
  )
    return null;
  const point = {
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
  return Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180
    ? point
    : null;
}
