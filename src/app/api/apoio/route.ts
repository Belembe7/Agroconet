import { customerApi } from "@/lib/customer-api";
import { prisma } from "@/lib/db";
import {
  isSupportAdmin,
  SupportService,
} from "@/services/support/support-service";

export async function GET(request: Request) {
  return customerApi(request, async (session) => {
    const id = new URL(request.url).searchParams.get("ticketId");
    const service = new SupportService(prisma);
    return id
      ? service.thread(session.actor, id)
      : {
          tickets: await service.list(session.actor),
          admin: isSupportAdmin(session.actor),
          userId: session.user.id,
        };
  });
}
export async function POST(request: Request) {
  return customerApi(request, async (session) =>
    new SupportService(prisma).send(session.actor, await request.json()),
  );
}
export async function PATCH(request: Request) {
  return customerApi(request, async (session) =>
    new SupportService(prisma).setStatus(session.actor, await request.json()),
  );
}
