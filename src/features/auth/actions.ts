"use server";

import { defaultAreaPathForRoles } from "@/lib/area-access";
import { getAppSession } from "@/lib/session";

export async function getPostLoginPathAction(): Promise<string> {
  const session = await getAppSession();
  return session ? defaultAreaPathForRoles(session.actor.roles) : "/";
}
