import { requireStaff } from "@/lib/auth";
import { noStore } from "@/lib/http";
import { getMenu } from "@/lib/menu/getMenu";

export const dynamic = "force-dynamic";

// The full menu including hidden items, for the dashboard editor.
export async function GET() {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;
  return Response.json(await getMenu(), { headers: noStore });
}
