import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menu/getMenu";

export const dynamic = "force-dynamic";

// The full menu including hidden items, for the dashboard editor.
// Closed to everyone until staff sign-in exists (next change).
export async function GET() {
  const staff = null;
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getMenu());
}
