import {
  NotificationChannel,
  type PrismaClient,
} from "@/generated/prisma/client";
import { z } from "zod";

const createSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(2000),
  data: z.record(z.string(), z.unknown()).optional(),
});

const preferenceSchema = z.object({
  channel: z.nativeEnum(NotificationChannel),
  type: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
});

/** In-app notifications and per-channel preferences. SMS/email delivery is deliberately
 * handled by provider adapters once credentials and a durable worker are configured. */
export class NotificationService {
  constructor(private readonly db: PrismaClient) {}

  async create(input: z.input<typeof createSchema>) {
    const value = createSchema.parse(input);
    return this.db.notification.create({
      data: {
        userId: value.userId,
        type: value.type,
        title: value.title,
        body: value.body,
        data: value.data as object | undefined,
      },
    });
  }

  async listForUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ) {
    const id = z.string().uuid().parse(userId);
    const limit = z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(30)
      .parse(options?.limit);
    return this.db.notification.findMany({
      where: { userId: id, ...(options?.unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /** Returns false for another user's or missing notification, avoiding IDOR disclosure. */
  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const user = z.string().uuid().parse(userId);
    const notification = z.string().uuid().parse(notificationId);
    const result = await this.db.notification.updateMany({
      where: { id: notification, userId: user, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count === 1;
  }

  async setPreference(userId: string, input: z.input<typeof preferenceSchema>) {
    const id = z.string().uuid().parse(userId);
    const value = preferenceSchema.parse(input);
    return this.db.notificationPreference.upsert({
      where: {
        userId_channel_type: {
          userId: id,
          channel: value.channel,
          type: value.type,
        },
      },
      create: { userId: id, ...value },
      update: { enabled: value.enabled },
    });
  }

  async getPreferences(userId: string) {
    const id = z.string().uuid().parse(userId);
    return this.db.notificationPreference.findMany({
      where: { userId: id },
      orderBy: [{ type: "asc" }, { channel: "asc" }],
    });
  }
}
