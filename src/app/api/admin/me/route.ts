import { getStaff } from "@/lib/auth";
import { backend } from "@/lib/env";
import { noStore } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  let staff = null;
  try {
    staff = await getStaff();
  } catch (error) {
    console.error("Staff check failed:", error);
  }
  return Response.json({ staff, backend: backend() }, { headers: noStore });
}
