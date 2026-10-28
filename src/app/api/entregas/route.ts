import { customerApi } from "@/lib/customer-api";
import { prisma } from "@/lib/db";
import { DeliveryMapService } from "@/services/delivery/delivery-map-service";
export async function GET(request: Request) {
  return customerApi(request, async (session) => ({
    deliveries: await new DeliveryMapService(prisma).list(session.actor),
  }));
}
export async function POST(request: Request) {
  return customerApi(request, async (session) =>
    new DeliveryMapService(prisma).saveDestination(
      session.actor,
      await request.json(),
    ),
  );
}
