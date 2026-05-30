import { cookies } from "next/headers";

export async function getAuth() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("wl_uid")?.value ?? null;
  return { userId };
}
