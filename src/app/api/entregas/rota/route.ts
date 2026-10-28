import { z } from "zod";
import { customerApi } from "@/lib/customer-api";
import { CustomerApiError } from "@/lib/customer-api-error";
import { prisma } from "@/lib/db";
import {
  DeliveryMapService,
  mapPointSchema,
} from "@/services/delivery/delivery-map-service";
import { calculateRoadRoute } from "@/services/delivery/road-route";
import {
  hasActiveRoute,
  pointFromSnapshot,
} from "@/features/delivery/route-types";

export async function POST(request: Request) {
  return customerApi(request, async (session) => {
    const input = z
      .object({
        deliveryId: z.string().uuid().optional(),
        origin: mapPointSchema.optional(),
        destination: mapPointSchema.optional(),
      })
      .parse(await request.json());
    let origin = input.origin;
    let destination = input.destination;
    if (input.deliveryId) {
      const row = await new DeliveryMapService(prisma).get(
        session.actor,
        input.deliveryId,
      );
      if (!hasActiveRoute(row.status))
        return { route: null, status: row.status };
      origin =
        pointFromSnapshot(row.pickupAddressSnapshot) ??
        pointFromSnapshot({
          latitude: row.sellerOrder.seller.latitude?.toString(),
          longitude: row.sellerOrder.seller.longitude?.toString(),
        }) ??
        undefined;
      destination = pointFromSnapshot(row.dropoffAddressSnapshot) ?? undefined;
    }
    if (!origin || !destination)
      throw new CustomerApiError(
        "Indique o ponto de partida e o destino. Numa entrega, a localização do vendedor precisa de estar registada.",
      );
    return { route: await calculateRoadRoute(origin, destination) };
  });
}
