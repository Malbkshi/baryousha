import { signIn } from "@/lib/auth";
import { noStore, readJson } from "@/lib/http";

const STATUS = { ok: 200, "bad-credentials": 401, "not-staff": 403, unavailable: 503 } as const;

export async function POST(request: Request) {
  const body = (await readJson(request)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || email.length > 200 || password.length > 200) {
    return Response.json({ result: "bad-credentials" }, { status: 401, headers: noStore });
  }

  try {
    const result = await signIn(email, password);
    return Response.json({ result }, { status: STATUS[result], headers: noStore });
  } catch (error) {
    console.error("Sign-in failed:", error);
    return Response.json({ result: "unavailable" }, { status: 503, headers: noStore });
  }
}
