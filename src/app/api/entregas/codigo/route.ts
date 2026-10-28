import { z } from "zod";
import { customerApi } from "@/lib/customer-api";
import { prisma } from "@/lib/db";
import { DeliveryMapService } from "@/services/delivery/delivery-map-service";
export async function POST(request: Request) {
  return customerApi(request, async (session) => {
    const { deliveryId } = z
      .object({ deliveryId: z.string().uuid() })
      .parse(await request.json());
    return new DeliveryMapService(prisma).confirmationCode(
      session.actor,
      deliveryId,
    );
  });
}
