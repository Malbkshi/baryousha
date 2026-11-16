import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { backend, supabaseEnv } from "@/lib/env";
import { getStore } from "@/lib/store";

export type Staff = { email: string };
export type SignInResult = "ok" | "bad-credentials" | "not-staff" | "unavailable";

const DEV_COOKIE = "dev_staff";

// Sessions for the dev-only password login. Lives as long as the dev server.
const holder = globalThis as unknown as { __baryoshaDevSessions?: Map<string, string> };
const devSessions = (holder.__baryoshaDevSessions ??= new Map<string, string>());

/** A Supabase client tied to this request's cookies. Uses the anon key only. */
async function sessionClient() {
  const env = supabaseEnv()!;
  const jar = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) jar.set(name, value, options);
        } catch {
          // Called while rendering, where cookies are read-only. The session
          // is refreshed on the next route-handler call instead.
        }
      },
    },
  });
}

function samePassword(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The signed-in member of staff, or null. Being signed in is not enough: the email must be in `staff`. */
export async function getStaff(): Promise<Staff | null> {
  const mode = backend();

  if (mode === "supabase") {
    const supabase = await sessionClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email) return null;
    const store = getStore()!;
    return (await store.isStaffEmail(email)) ? { email } : null;
  }

  if (mode === "memory") {
    const token = (await cookies()).get(DEV_COOKIE)?.value;
    const email = token ? devSessions.get(token) : undefined;
    return email ? { email } : null;
  }

  return null;
}

/** For route handlers: the staff member, or the 401 response to return. */
export async function requireStaff(): Promise<Staff | Response> {
  try {
    const staff = await getStaff();
    if (staff) return staff;
  } catch (error) {
    console.error("Staff check failed:", error);
  }
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const mode = backend();

  if (mode === "supabase") {
    const supabase = await sessionClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user?.email) return "bad-credentials";
    if (!(await getStore()!.isStaffEmail(data.user.email))) {
      await supabase.auth.signOut();
      return "not-staff";
    }
    return "ok";
  }

  if (mode === "memory") {
    const expected = process.env.DEV_STAFF_PASSWORD;
    if (!expected) return "unavailable";
    if (!samePassword(password, expected)) return "bad-credentials";
    const token = randomBytes(24).toString("base64url");
    devSessions.set(token, email);
    (await cookies()).set(DEV_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
    return "ok";
  }

  return "unavailable";
}

export async function signOut(): Promise<void> {
  const mode = backend();
  if (mode === "supabase") {
    await (await sessionClient()).auth.signOut();
  } else if (mode === "memory") {
    const jar = await cookies();
    const token = jar.get(DEV_COOKIE)?.value;
    if (token) devSessions.delete(token);
    jar.delete(DEV_COOKIE);
  }
}
