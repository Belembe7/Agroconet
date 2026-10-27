import "dotenv/config";
import { prisma } from "@/lib/db";
import { InventoryService } from "@/services/inventory/inventory-service";

async function main() {
  const released = await new InventoryService(prisma).expireDueReservations({
    limit: 500,
  });
  console.info(
    JSON.stringify({
      task: "expire-stock-reservations",
      released,
      at: new Date().toISOString(),
    }),
  );
}

main()
  .catch((error: unknown) => {
    console.error("Reservation expiry worker failed", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
