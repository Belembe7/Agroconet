import type { PrismaClient, Role } from "@/generated/prisma/client";
import {
  assertCan,
  type Actor,
  PermissionDeniedError,
} from "@/lib/permissions";
import { AuditService } from "@/services/audit/audit-service";

const PRIVILEGED_ROLES: readonly Role[] = ["SUPER_ADMIN", "ADMIN"];

export function canGrantRole(actor: Actor, role: Role): boolean {
  try {
    assertCan(actor, "user:manage");
  } catch {
    return false;
  }

  // Only SUPER_ADMIN may grant or revoke admin-level roles.
  if (PRIVILEGED_ROLES.includes(role)) {
    return actor.roles.includes("SUPER_ADMIN");
  }

  return true;
}

export function assertCanGrantRole(actor: Actor, role: Role): void {
  if (!canGrantRole(actor, role)) {
    throw new PermissionDeniedError("user:manage");
  }
}

export class RoleService {
  private readonly audit: AuditService;

  constructor(private readonly db: PrismaClient) {
    this.audit = new AuditService(db);
  }

  async grantRole(input: {
    actor: Actor;
    userId: string;
    role: Role;
  }): Promise<void> {
    assertCanGrantRole(input.actor, input.role);

    const before = await this.db.userRole.findMany({
      where: { userId: input.userId },
      select: { role: true },
    });

    await this.db.userRole.upsert({
      where: {
        userId_role: { userId: input.userId, role: input.role },
      },
      create: {
        userId: input.userId,
        role: input.role,
        grantedById: input.actor.userId,
      },
      update: {},
    });

    await this.invalidateSessions(input.userId);

    await this.audit.log({
      action: "role.grant",
      entityType: "User",
      entityId: input.userId,
      actor: input.actor,
      before: { roles: before.map((r) => r.role) },
      after: { role: input.role },
    });
  }

  async revokeRole(input: {
    actor: Actor;
    userId: string;
    role: Role;
  }): Promise<void> {
    assertCanGrantRole(input.actor, input.role);

    const before = await this.db.userRole.findMany({
      where: { userId: input.userId },
      select: { role: true },
    });

    await this.db.userRole.deleteMany({
      where: { userId: input.userId, role: input.role },
    });

    await this.invalidateSessions(input.userId);

    await this.audit.log({
      action: "role.revoke",
      entityType: "User",
      entityId: input.userId,
      actor: input.actor,
      before: { roles: before.map((r) => r.role) },
      after: { role: input.role },
    });
  }

  private async invalidateSessions(userId: string): Promise<void> {
    await this.db.session.deleteMany({ where: { userId } });
  }
}
