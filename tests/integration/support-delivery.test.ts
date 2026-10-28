import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { SupportService } from "@/services/support/support-service";
import { DeliveryMapService } from "@/services/delivery/delivery-map-service";
import { DeliveryService } from "@/services/delivery/delivery-service";
import { OrderService } from "@/services/orders/order-service";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
afterAll(() => db.$disconnect());
async function fixture(
  run: (
    db: PrismaClient,
    actors: {
      customer: Actor;
      other: Actor;
      admin: Actor;
      driver: Actor;
      deliveryId: string;
    },
  ) => Promise<void>,
) {
  const rollback = new Error("ROLLBACK_SUPPORT_DELIVERY");
  try {
    await db.$transaction(
      async (tx) => {
        const users = await Promise.all(
          ["customer", "other", "admin", "driver"].map((name) =>
            tx.user.create({
              data: { name, email: `${randomUUID()}@support.test` },
            }),
          ),
        );
        const [customerUser, otherUser, adminUser, driverUser] = users;
        await tx.userRole.create({
          data: { userId: adminUser.id, role: "ADMIN" },
        });
        const seller = await tx.seller.create({
          data: {
            userId: otherUser.id,
            businessName: "Test seller",
            phone: "12345678",
            province: "Maputo",
            district: "Maputo",
            addressText: "Recolha",
            slug: randomUUID(),
            latitude: -25.9692,
            longitude: 32.5732,
          },
        });
        const driver = await tx.driver.create({
          data: {
            userId: driverUser.id,
            vehicleType: "MOTORCYCLE",
            status: "ACTIVE",
            availability: "BUSY",
          },
        });
        const order = await tx.order.create({
          data: {
            userId: customerUser.id,
            number: randomUUID(),
            subtotalCents: 0,
            deliveryTotalCents: 0,
            totalCents: 0,
            shippingAddressSnapshot: {},
            contactPhone: "12345678",
            idempotencyKey: randomUUID(),
          },
        });
        const group = await tx.sellerOrder.create({
          data: {
            orderId: order.id,
            sellerId: seller.id,
            subtotalCents: 0,
            deliveryFeeCents: 0,
            commissionCents: 0,
            sellerNetCents: 0,
          },
        });
        const delivery = await tx.delivery.create({
          data: {
            sellerOrderId: group.id,
            driverId: driver.id,
            status: "EN_ROUTE_TO_CUSTOMER",
            pickupAddressSnapshot: { latitude: -25.9692, longitude: 32.5732 },
            dropoffAddressSnapshot: { latitude: -25.9622, longitude: 32.4589 },
            feeCents: 0,
            driverFeeCents: 0,
          },
        });
        // Services can open atomic operations without committing these isolated fixtures.
        const transactional = new Proxy(tx, {
          get(target, property) {
            if (property === "$transaction")
              return async (
                callback: (client: Prisma.TransactionClient) => unknown,
              ) => callback(tx);
            return Reflect.get(target, property);
          },
        }) as PrismaClient;
        await run(transactional, {
          customer: { userId: customerUser.id, roles: ["CUSTOMER"] },
          other: { userId: otherUser.id, roles: ["CUSTOMER"] },
          admin: { userId: adminUser.id, roles: ["ADMIN"] },
          driver: {
            userId: driverUser.id,
            roles: ["DRIVER"],
            driverId: driver.id,
          },
          deliveryId: delivery.id,
        });
        throw rollback;
      },
      { timeout: 60000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe("Customer support and delivery routes", () => {
  it("creates a delivery with coordinates when checkout places a new order, without duplicating retries", async () => {
    await fixture(async (db, a) => {
      const seller = await db.seller.findUniqueOrThrow({
        where: { userId: a.other.userId },
      });
      const category = await db.category.create({
        data: { name: "Route test", slug: randomUUID() },
      });
      const product = await db.product.create({
        data: {
          name: "Sementes",
          slug: randomUUID(),
          sellerId: seller.id,
          categoryId: category.id,
          status: "ACTIVE",
        },
      });
      const variant = await db.productVariant.create({
        data: {
          productId: product.id,
          sku: randomUUID(),
          label: "1 kg",
          unit: "KG",
          unitSize: 1,
          priceCents: 10000,
          inventory: { create: { quantityOnHand: 5 } },
        },
      });
      const address = await db.address.create({
        data: {
          userId: a.customer.userId,
          label: "Casa",
          recipientName: "Cliente",
          phone: "12345678",
          province: "Maputo",
          district: "Matola",
          neighborhood: "Matola A",
          reference: "Portão",
          latitude: -25.98,
          longitude: 32.46,
        },
      });
      const input = {
        userId: a.customer.userId,
        addressId: address.id,
        paymentMethod: "COD" as const,
        idempotencyKey: randomUUID(),
        cart: {
          itemCount: 1,
          totalCents: 10000,
          groups: [
            {
              sellerId: seller.id,
              sellerName: seller.businessName,
              subtotalCents: 10000,
              items: [
                {
                  id: randomUUID(),
                  variantId: variant.id,
                  productSlug: product.slug,
                  productName: product.name,
                  productBrand: null,
                  sellerId: seller.id,
                  sellerName: seller.businessName,
                  variantLabel: "1 kg",
                  priceCents: 10000,
                  quantity: 1,
                  available: 5,
                  imageUrl: null,
                  imageAlt: null,
                  lineTotalCents: 10000,
                },
              ],
            },
          ],
        },
      };
      const service = new OrderService(db);
      const order = await service.place(input);
      expect((await service.place(input)).id).toBe(order.id);
      const deliveries = await db.delivery.findMany({
        where: { sellerOrder: { orderId: order.id } },
      });
      expect(deliveries).toHaveLength(1);
      expect(deliveries[0].dropoffAddressSnapshot).toMatchObject({
        latitude: "-25.98",
        longitude: "32.46",
      });
      expect(deliveries[0].pickupAddressSnapshot).toMatchObject({
        latitude: "-25.9692",
        longitude: "32.5732",
      });
    });
  });
  it("sends messages to admin, preserves replies and status, and isolates customers", async () => {
    await fixture(async (db, a) => {
      const service = new SupportService(db);
      const ticket = await service.send(a.customer, {
        subject: "Prazo da entrega",
        body: "Quando chega?",
      });
      expect(
        (await service.list(a.customer)).some((row) => row.id === ticket.id),
      ).toBe(true);
      expect(
        (await service.list(a.other)).some((row) => row.id === ticket.id),
      ).toBe(false);
      await expect(service.thread(a.other, ticket.id)).rejects.toMatchObject({
        status: 404,
      });
      await expect(
        service.send(a.other, { ticketId: ticket.id, body: "Intrusão" }),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        service.setStatus(a.customer, {
          ticketId: ticket.id,
          status: "RESOLVED",
        }),
      ).rejects.toMatchObject({ status: 403 });
      expect(
        await db.notification.count({
          where: { userId: a.admin.userId, type: "support.message" },
        }),
      ).toBe(1);
      await service.send(a.admin, {
        ticketId: ticket.id,
        body: "Vamos confirmar consigo.",
      });
      expect(
        (await service.thread(a.customer, ticket.id)).messages,
      ).toHaveLength(2);
      expect((await service.thread(a.customer, ticket.id)).status).toBe(
        "IN_PROGRESS",
      );
      await service.setStatus(a.admin, {
        ticketId: ticket.id,
        status: "RESOLVED",
      });
      expect((await service.thread(a.customer, ticket.id)).status).toBe(
        "RESOLVED",
      );
      await service.send(a.customer, {
        ticketId: ticket.id,
        body: "Outra dúvida.",
      });
      expect((await service.thread(a.customer, ticket.id)).status).toBe("OPEN");
    });
  });
  it("saves only an owner's destination and hides routes after confirmed delivery", async () => {
    await fixture(async (db, a) => {
      const service = new DeliveryMapService(db);
      const destination = {
        deliveryId: a.deliveryId,
        latitude: -25.99,
        longitude: 32.55,
      };
      await expect(
        service.saveDestination(a.other, destination),
      ).rejects.toMatchObject({ status: 404 });
      await expect(service.get(a.other, a.deliveryId)).rejects.toMatchObject({
        status: 404,
      });
      await expect(
        service.saveOrigin(a.customer, destination),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        service.saveDestination(a.customer, destination),
      ).rejects.toMatchObject({ status: 409 });
      await db.delivery.update({
        where: { id: a.deliveryId },
        data: { status: "ASSIGNED" },
      });
      await service.saveDestination(a.customer, destination);
      const before = (await service.list(a.customer)).find(
        (row) => row.id === a.deliveryId,
      )!;
      expect(before.destination).toEqual({
        latitude: -25.99,
        longitude: 32.55,
      });
      expect(before.routeActive).toBe(true);
      await db.delivery.update({
        where: { id: a.deliveryId },
        data: { status: "EN_ROUTE_TO_CUSTOMER" },
      });
      const { code } = await service.confirmationCode(a.customer, a.deliveryId);
      await expect(
        new DeliveryService(db).transition(
          a.driver,
          a.deliveryId,
          "DELIVERED",
          { code: "invalid" },
        ),
      ).rejects.toThrow("Código");
      await new DeliveryService(db).transition(
        a.driver,
        a.deliveryId,
        "DELIVERED",
        { code },
      );
      const after = (await service.list(a.customer)).find(
        (row) => row.id === a.deliveryId,
      )!;
      expect(after.status).toBe("DELIVERED");
      expect(after.routeActive).toBe(false);
      expect(after.canEdit).toBe(false);
      await expect(
        service.saveDestination(a.customer, destination),
      ).rejects.toMatchObject({ status: 409 });
      await expect(
        service.confirmationCode(a.customer, a.deliveryId),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
