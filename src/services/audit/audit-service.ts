import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Actor } from "@/lib/permissions";

export type AuditEntry = {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  /** Override actor when logging system actions */
  actor?: Actor | null;
  actorRole?: string | null;
};

export class AuditService {
  constructor(private readonly db: PrismaClient) {}

  async log(entry: AuditEntry): Promise<void> {
    const actor = entry.actor;
    await this.db.auditLog.create({
      data: {
        actorUserId: actor?.userId ?? null,
        actorRole: entry.actorRole ?? actor?.roles[0] ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        before: entry.before ?? undefined,
        after: entry.after ?? undefined,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        requestId: entry.requestId ?? null,
      },
    });
  }
}
