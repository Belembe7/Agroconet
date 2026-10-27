"use server";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CartService } from "@/services/cart/cart-service";
import { OrderService } from "@/services/orders/order-service";
export async function placeOrderAction(formData: FormData) {
  const session = await getAppSession();
  if (!session?.actor.roles.includes("CUSTOMER"))
    redirect("/entrar?next=%2Fcheckout");
  const addressId = String(formData.get("addressId") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "");
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  if (
    !/^[0-9a-f-]{36}$/i.test(addressId) ||
    paymentMethod !== "COD" ||
    !/^[0-9a-f-]{36}$/i.test(idempotencyKey)
  )
    throw new Error("Dados do checkout inválidos.");
  const previousOrder = await prisma.order.findFirst({
    where: { userId: session.user.id, idempotencyKey },
    select: { id: true },
  });
  if (previousOrder)
    redirect(`/cliente/pedidos/${previousOrder.id}?pedido=feito`);
  const cart = await new CartService(prisma).read({ userId: session.user.id });
  const order = await new OrderService(prisma).place({
    userId: session.user.id,
    cart,
    addressId,
    paymentMethod,
    idempotencyKey,
  });
  await prisma.cartItem.deleteMany({
    where: { cart: { userId: session.user.id } },
  });
  redirect(`/cliente/pedidos/${order.id}?pedido=feito`);
}
