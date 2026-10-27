import { connection } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  await connection();

  const startedAt = Date.now();
  let database: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  const status = database === "ok" ? "ok" : "degraded";
  const httpStatus = database === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status,
      service: "agroconet",
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt,
      checks: {
        database: {
          status: database,
          ...(database === "error" ? { error: "unreachable" } : {}),
        },
      },
    },
    { status: httpStatus },
  );
}
