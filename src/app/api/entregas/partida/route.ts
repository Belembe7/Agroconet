import { customerApi } from "@/lib/customer-api";
import { prisma } from "@/lib/db";
import { DeliveryMapService } from "@/services/delivery/delivery-map-service";
export async function POST(request: Request) {
  return customerApi(request, async (session) =>
    new DeliveryMapService(prisma).saveOrigin(
      session.actor,
      await request.json(),
    ),
  );
}
