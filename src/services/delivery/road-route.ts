import { CustomerApiError } from "@/lib/customer-api-error";
import type { MapPoint, RoadRoute } from "@/features/delivery/route-types";

export async function calculateRoadRoute(
  origin: MapPoint,
  destination: MapPoint,
): Promise<RoadRoute> {
  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${coordinates}`,
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  let data;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Routing provider unavailable");
    data = await response.json();
  } catch {
    throw new CustomerApiError(
      "O serviço de rotas está temporariamente indisponível. Tente novamente.",
      503,
    );
  }
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route?.geometry?.coordinates?.length)
    throw new CustomerApiError(
      "Não foi encontrada uma rota por estrada para esse ponto. Escolha um local acessível.",
      422,
    );
  return {
    coordinates: route.geometry.coordinates,
    distance: route.distance,
    duration: route.duration,
  };
}
