import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { CartService } from "@/services/cart/cart-service";
import { prisma } from "@/lib/db";
import { getAppSession, type AppSession } from "@/lib/session";

export const CART_COOKIE_NAME = "agroconet.cart";
const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function hashGuestCartToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isCustomerSession(
  session: AppSession | null,
): session is AppSession {
  return Boolean(session?.actor.roles.includes("CUSTOMER"));
}

export async function currentGuestCartHash() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  return token && GUEST_TOKEN_PATTERN.test(token)
    ? hashGuestCartToken(token)
    : null;
}

export async function ensureCustomerAccount(session: AppSession) {
  if (!isCustomerSession(session)) return false;
  const user = await prisma.user.findFirst({
    where: { id: session.user.id, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  return Boolean(user);
}

export async function getCurrentCartSnapshot() {
  const [session, guestHash] = await Promise.all([
    getAppSession(),
    currentGuestCartHash(),
  ]);
  const cartService = new CartService(prisma);
  if (
    session &&
    isCustomerSession(session) &&
    (await ensureCustomerAccount(session))
  )
    return cartService.read({ userId: session.user.id });
  if (session) return { groups: [], itemCount: 0, totalCents: 0 };
  if (guestHash) return cartService.read({ anonymousTokenHash: guestHash });
  return { groups: [], itemCount: 0, totalCents: 0 };
}

export async function getCurrentCartIdForMutation() {
  const session = await getAppSession();
  const cartService = new CartService(prisma);
  if (session) {
    if (!(await ensureCustomerAccount(session))) return null;
    const cart = await cartService.getOrCreateUserCart(session.user.id);
    const guestHash = await currentGuestCartHash();
    if (guestHash) {
      await cartService.mergeGuestIntoUser(session.user.id, guestHash);
      (await cookies()).delete(CART_COOKIE_NAME);
    }
    return cart.id;
  }
  const guestHash = await currentGuestCartHash();
  if (!guestHash) return null;
  const cart = await cartService.getOrCreateGuestCart(guestHash);
  return cart.id;
}
