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

export type HeroSlide = {
  image: string;
  titleAr: string;
  titleEn: string;
  price: number;
};

export type MenuData = {
  categories: MenuCategory[];
  heroSlides: HeroSlide[];
};

/** The menu shipped with the site. Used until one is saved from the dashboard. */
export const bundledMenu: MenuData = menuData as MenuData;

export const categories: MenuCategory[] = bundledMenu.categories;
export const heroSlides = bundledMenu.heroSlides;

export const totalMenuItems = categories.reduce(
  (sum, c) => sum + c.items.length,
  0
);
