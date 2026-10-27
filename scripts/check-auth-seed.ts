import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const user = await prisma.user.findUnique({
    where: { phoneNumber: "+258840000031" },
    include: { accounts: true },
  });

  console.log("user", user?.id, user?.phoneNumber, user?.phoneNumberVerified);
  console.log(
    "accounts",
    user?.accounts.map((a) => ({
      providerId: a.providerId,
      accountId: a.accountId,
      pass: a.password?.slice(0, 40),
    })),
  );

  const acc = user?.accounts.find((a) => a.providerId === "credential");
  if (acc?.password) {
    console.log(
      "verify",
      await verifyPassword({ hash: acc.password, password: "AgroconetDev1!" }),
    );
  } else {
    console.log("no credential account");
  }

  const fresh = await hashPassword("AgroconetDev1!");
  console.log(
    "fresh verify",
    await verifyPassword({ hash: fresh, password: "AgroconetDev1!" }),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
