"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CartService } from "@/services/cart/cart-service";
import { prisma } from "@/lib/db";
import { getAppSession } from "@/lib/session";
import {
  CART_COOKIE_NAME,
  currentGuestCartHash,
  ensureCustomerAccount,
  getCurrentCartIdForMutation,
  hashGuestCartToken,
  isCustomerSession,
} from "@/features/cart/server";

const GUEST_CART_TTL_SECONDS = 30 * 24 * 60 * 60;

export type AddToCartState =
  { ok: true; message: string } | { ok: false; error: string };

export async function addToCartAction(
  _previousState: AddToCartState | null,
  formData: FormData,
): Promise<AddToCartState> {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? "1");
  if (!/^[0-9a-f-]{36}$/i.test(variantId))
    return { ok: false, error: "Escolha uma opção válida." };
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99)
    return { ok: false, error: "Escolha uma quantidade entre 1 e 99." };

  const session = await getAppSession();
  const cartService = new CartService(prisma);
  let cartId: string;
  if (session) {
    if (!(await ensureCustomerAccount(session)))
      return {
        ok: false,
        error: "O carrinho está disponível para contas de cliente.",
      };
    const cart = await cartService.getOrCreateUserCart(session.user.id);
    cartId = cart.id;
    const guestHash = await currentGuestCartHash();
    if (guestHash) {
      await cartService.mergeGuestIntoUser(session.user.id, guestHash);
      (await cookies()).delete(CART_COOKIE_NAME);
    }
  } else {
    const cookieStore = await cookies();
    const existing = cookieStore.get(CART_COOKIE_NAME)?.value;
    const token =
      existing && /^[A-Za-z0-9_-]{43}$/.test(existing)
        ? existing
        : randomBytes(32).toString("base64url");
    const guestCart = await cartService.getOrCreateGuestCart(
      hashGuestCartToken(token),
    );
    cartId = guestCart.id;
    if (!existing || !/^[A-Za-z0-9_-]{43}$/.test(existing)) {
      cookieStore.set(CART_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: GUEST_CART_TTL_SECONDS,
      });
    }
  }

  const result = await cartService.addItem(cartId, variantId, quantity);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/carrinho");
  return { ok: true, message: "Adicionado ao carrinho." };
}

export async function setCartItemQuantityAction(
  itemId: string,
  quantity: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(itemId))
    return { ok: false, error: "Artigo inválido." };
  const cartId = await getCurrentCartIdForMutation();
  if (!cartId)
    return { ok: false, error: "O carrinho já não está disponível." };
  const service = new CartService(prisma);
  if (quantity === 0) {
    await service.removeItem(cartId, itemId);
    revalidatePath("/carrinho");
    return { ok: true };
  }
  const result = await service.setQuantity(cartId, itemId, quantity);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/carrinho");
  return { ok: true };
}

export async function removeCartItemAction(itemId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(itemId))
    return { ok: false as const, error: "Artigo inválido." };
  const cartId = await getCurrentCartIdForMutation();
  if (!cartId)
    return { ok: false as const, error: "O carrinho já não está disponível." };
  await new CartService(prisma).removeItem(cartId, itemId);
  revalidatePath("/carrinho");
  return { ok: true as const };
}

export async function mergeGuestCartAfterLogin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getAppSession();
  if (!session || !isCustomerSession(session)) return { ok: true };
  if (!(await ensureCustomerAccount(session)))
    return {
      ok: false,
      error: "Não foi possível sincronizar o carrinho desta conta.",
    };
  const guestHash = await currentGuestCartHash();
  if (!guestHash) return { ok: true };
  try {
    await new CartService(prisma).mergeGuestIntoUser(
      session.user.id,
      guestHash,
    );
    (await cookies()).delete(CART_COOKIE_NAME);
    revalidatePath("/carrinho");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Entre novamente no carrinho para sincronizar os artigos.",
    };
  }
}
