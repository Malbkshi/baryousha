import { requireStaff } from "@/lib/auth";
import { noStore, readJson } from "@/lib/http";
import { getSettings } from "@/lib/orders/service";
import { mergeSettings } from "@/lib/orders/settings";
import type { Settings } from "@/lib/orders/types";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const unavailable = () => Response.json({ error: "server" }, { status: 503, headers: noStore });

export async function GET() {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;
  const store = getStore();
  if (!store) return unavailable();
  try {
    return Response.json(await getSettings(store), { headers: noStore });
  } catch (error) {
    console.error("Settings read failed:", error);
    return unavailable();
  }
}

export async function PUT(request: Request) {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;
  const store = getStore();
  if (!store) return unavailable();

  const body = await readJson(request);
  let settings: Settings | null;
  try {
    settings = mergeSettings(await getSettings(store), body);
  } catch (error) {
    console.error("Settings read failed:", error);
    return unavailable();
  }
  if (!settings) {
    return Response.json({ error: "invalid" }, { status: 400, headers: noStore });
  }

  try {
    await store.setDoc("settings", settings);
    return Response.json(settings, { headers: noStore });
  } catch (error) {
    console.error("Settings write failed:", error);
    return unavailable();
  }
}
