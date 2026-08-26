import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-constants";

export async function getSession(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
