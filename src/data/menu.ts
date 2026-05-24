import menuData from './menu.json';

export type MenuItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  note?: string;
  image?: string;
  hidden?: boolean;
};

export type MenuCategory = {
  id: string;
  titleEn: string;
  titleAr: string;
  icon: "croissant" | "milkshake" | "juice" | "coffee" | "avocado" | "yogurt";
  items: MenuItem[];
};

export const categories: MenuCategory[] = menuData.categories as MenuCategory[];
export const heroSlides = menuData.heroSlides;

export const totalMenuItems = categories.reduce(
  (sum, c) => sum + c.items.length,
  0
);
