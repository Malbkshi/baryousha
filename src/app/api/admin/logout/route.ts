import { signOut } from "@/lib/auth";
import { noStore } from "@/lib/http";

export async function POST() {
  try {
    await signOut();
  } catch (error) {
    console.error("Sign-out failed:", error);
  }
  return Response.json({ ok: true }, { headers: noStore });
}
