import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { LandingService } from "@/services/catalog/landing-service";

const service = new LandingService(prisma);
export async function getLandingCategories() {
  "use cache";
  cacheLife("minutes");
  cacheTag("landing", "categories");
  return service.categories();
}
export async function getLandingHighlights(q: string, category: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("landing", "products");
  return service.highlights({ q, category });
}
export async function getPublicContacts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("landing", "company-contacts");
  return service.contacts();
}
export async function getDeliveryZones() {
  "use cache";
  cacheLife("minutes");
  cacheTag("landing", "delivery-zones");
  return service.deliveryZones();
}
