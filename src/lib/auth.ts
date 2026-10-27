import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { vercelTrustedOrigins } from "@/lib/deployment-url";
import { AuditService } from "@/services/audit/audit-service";

const audit = new AuditService(prisma);

export const auth = betterAuth({
  appName: "Agroconet",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_APP_URL,
    ...vercelTrustedOrigins({
      environment: process.env.VERCEL_ENV,
      deploymentHost: process.env.VERCEL_URL,
      branchHost: process.env.VERCEL_BRANCH_URL,
      productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    }),
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      if (env.NODE_ENV === "production") {
        throw new Error(
          "Email provider must be configured before enabling password recovery.",
        );
      }
      console.info(`[DEV PASSWORD RESET] ${user.email} → ${url}`);
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 40,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
  user: {
    additionalFields: {
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.$transaction([
            prisma.userRole.create({
              data: { userId: user.id, role: Role.CUSTOMER },
            }),
            prisma.customer.create({
              data: { userId: user.id },
            }),
          ]);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          const roles = await prisma.userRole.findMany({
            where: { userId: session.userId },
            select: { role: true },
          });
          await prisma.user.update({
            where: { id: session.userId },
            data: { lastLoginAt: new Date() },
          });
          await audit.log({
            action: "auth.login",
            entityType: "User",
            entityId: session.userId,
            actor: {
              userId: session.userId,
              roles: roles.map((r) => r.role),
            },
          });
        },
      },
      delete: {
        after: async (session) => {
          const roles = await prisma.userRole.findMany({
            where: { userId: session.userId },
            select: { role: true },
          });
          await audit.log({
            action: "auth.logout",
            entityType: "User",
            entityId: session.userId,
            actor: {
              userId: session.userId,
              roles: roles.map((r) => r.role),
            },
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
