import { z } from "zod";
import { getAppSession, type AppSession } from "@/lib/session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { CustomerApiError } from "@/lib/customer-api-error";

export async function customerApi(
  request: Request,
  handler: (session: AppSession) => Promise<unknown>,
) {
  try {
    const session = await getAppSession();
    if (!session)
      throw new CustomerApiError("Entre na sua conta para continuar.", 401);
    if (request.method !== "GET") {
      if (request.headers.get("origin") !== new URL(request.url).origin)
        throw new CustomerApiError("Origem do pedido inválida.", 403);
      if (
        !consumeRateLimit(`customer-api:${session.user.id}`, {
          max: 30,
          windowMs: 60000,
        }).allowed
      )
        throw new CustomerApiError(
          "Aguarde um minuto antes de tentar novamente.",
          429,
        );
    }
    return Response.json(await handler(session), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status =
      error instanceof CustomerApiError
        ? error.status
        : error instanceof z.ZodError
          ? 400
          : 500;
    const message =
      error instanceof CustomerApiError
        ? error.message
        : error instanceof z.ZodError
          ? "Verifique os dados introduzidos."
          : "Não foi possível concluir o pedido. Tente novamente.";
    if (status === 500) console.error("Customer API failed", error);
    return Response.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
