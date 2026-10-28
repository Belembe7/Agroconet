import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";
import { CustomerApiError } from "@/lib/customer-api-error";

export const supportInput = z.object({
  ticketId: z.string().uuid().optional(),
  subject: z.string().trim().min(3).max(160).optional(),
  body: z.string().trim().min(1).max(4000),
});
export const isSupportAdmin = (actor: Actor) =>
  actor.roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN");

export class SupportService {
  constructor(private db: PrismaClient) {}

  async list(actor: Actor) {
    return this.db.supportTicket.findMany({
      where: isSupportAdmin(actor) ? {} : { userId: actor.userId },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  async thread(actor: Actor, id: string) {
    z.string().uuid().parse(id);
    const ticket = await this.db.supportTicket.findFirst({
      where: {
        id,
        ...(!isSupportAdmin(actor) ? { userId: actor.userId } : {}),
      },
      include: {
        messages: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!ticket) throw new CustomerApiError("Conversa não encontrada.", 404);
    return ticket;
  }

  async send(actor: Actor, input: unknown) {
    const value = supportInput.parse(input);
    const admin = isSupportAdmin(actor);
    if (value.ticketId) await this.thread(actor, value.ticketId);
    else if (admin)
      throw new CustomerApiError("Seleccione uma conversa para responder.");
    else if (!value.subject)
      throw new CustomerApiError("Indique o assunto da sua dúvida.");
    return this.db.$transaction(async (tx) => {
      const ticket = value.ticketId
        ? await tx.supportTicket.update({
            where: { id: value.ticketId },
            data: {
              updatedAt: new Date(),
              status: admin ? "IN_PROGRESS" : "OPEN",
            },
          })
        : await tx.supportTicket.create({
            data: { userId: actor.userId, subject: value.subject! },
          });
      await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          userId: actor.userId,
          body: value.body,
          isAdmin: admin,
        },
      });
      const recipients = admin
        ? [ticket.userId]
        : (
            await tx.userRole.findMany({
              where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
              select: { userId: true },
              distinct: ["userId"],
            })
          ).map((row) => row.userId);
      await tx.notification.createMany({
        data: recipients
          .filter((id) => id !== actor.userId)
          .map((userId) => ({
            userId,
            type: "support.message",
            title: admin ? "Resposta à sua dúvida" : "Nova mensagem de apoio",
            body: value.body.slice(0, 300),
            data: {
              ticketId: ticket.id,
              href: admin ? "/apoio" : "/admin/apoio",
            },
          })),
      });
      return { id: ticket.id };
    });
  }

  async setStatus(actor: Actor, input: unknown) {
    if (!isSupportAdmin(actor))
      throw new CustomerApiError(
        "Apenas a administração pode alterar o estado.",
        403,
      );
    const value = z
      .object({
        ticketId: z.string().uuid(),
        status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
      })
      .parse(input);
    const ticket = await this.thread(actor, value.ticketId);
    return this.db.$transaction(async (tx) => {
      const updated = await tx.supportTicket.update({
        where: { id: value.ticketId },
        data: { status: value.status },
      });
      await tx.notification.create({
        data: {
          userId: ticket.userId,
          type: "support.status",
          title: "Estado do atendimento actualizado",
          body:
            value.status === "RESOLVED"
              ? "A sua dúvida foi marcada como resolvida."
              : "O estado da sua dúvida foi actualizado.",
          data: { ticketId: ticket.id, href: "/apoio" },
        },
      });
      return updated;
    });
  }
}
