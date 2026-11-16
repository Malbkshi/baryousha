import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { noStore, readJson } from "@/lib/http";
import { getMenu, isMenuData } from "@/lib/menu/getMenu";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const MAX_MENU_BYTES = 500_000;

// The full menu including hidden items, for the dashboard editor.
export async function GET() {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;
  return Response.json(await getMenu(), { headers: noStore });
}

// Saves the whole menu from the dashboard editor.
export async function POST(request: Request) {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;

  const menu = await readJson(request, MAX_MENU_BYTES);
  if (!isMenuData(menu)) {
    return Response.json({ error: "invalid" }, { status: 400, headers: noStore });
  }

  const ids = menu.categories.flatMap((category) => category.items.map((item) => item.id));
  if (new Set(ids).size !== ids.length) {
    return Response.json({ error: "duplicate-ids" }, { status: 400, headers: noStore });
  }

  const store = getStore();
  if (!store) return Response.json({ error: "server" }, { status: 503, headers: noStore });

  try {
    await store.setDoc("menu", { categories: menu.categories, heroSlides: menu.heroSlides });
    revalidatePath("/");
    return Response.json({ success: true }, { headers: noStore });
  } catch (error) {
    console.error("Menu save failed:", error);
    return Response.json({ error: "server" }, { status: 503, headers: noStore });
  }
}
