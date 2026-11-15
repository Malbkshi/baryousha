import { bundledMenu, type MenuData } from "@/data/menu";
import { getStore, type Store } from "@/lib/store";

/** Shape check for a menu document, used before trusting or saving one. */
export function isMenuData(value: unknown): value is MenuData {
  const menu = value as MenuData | null;
  if (!menu || !Array.isArray(menu.categories) || !Array.isArray(menu.heroSlides)) {
    return false;
  }
  return menu.categories.every(
    (category) =>
      category &&
      typeof category.id === "string" &&
      typeof category.titleAr === "string" &&
      Array.isArray(category.items) &&
      category.items.every(
        (item) =>
          item &&
          typeof item.id === "string" &&
          item.id.length > 0 &&
          typeof item.nameAr === "string" &&
          typeof item.price === "number" &&
          Number.isFinite(item.price) &&
          item.price >= 0,
      ),
  );
}

/**
 * The menu saved from the dashboard, or the bundled one when nothing is
 * saved, there is no store, or the store is failing. Never throws: the
 * menu has to render even when the database does not answer.
 */
export async function loadMenu(store: Store | null): Promise<MenuData> {
  if (!store) return bundledMenu;
  try {
    const saved = await store.getDoc<unknown>("menu");
    return isMenuData(saved) ? saved : bundledMenu;
  } catch (error) {
    console.error("Menu load failed, serving the bundled menu:", error);
    return bundledMenu;
  }
}

export function getMenu(): Promise<MenuData> {
  return loadMenu(getStore());
}

/** What customers see: no hidden items, no categories left empty. */
export function publicMenu(menu: MenuData): MenuData {
  return {
    heroSlides: menu.heroSlides,
    categories: menu.categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => !item.hidden),
      }))
      .filter((category) => category.items.length > 0),
  };
}
