import {
  Coffee,
  Croissant,
  CupSoda,
  GlassWater,
  IceCreamCone,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import type { MenuCategory } from "@/data/menu";

const iconMap: Record<MenuCategory["icon"], LucideIcon> = {
  croissant: Croissant,
  milkshake: CupSoda,
  juice: GlassWater,
  coffee: Coffee,
  avocado: Leaf,
  yogurt: IceCreamCone,
};

export function CategoryIcon({
  icon,
  className,
}: {
  icon: MenuCategory["icon"];
  className?: string;
}) {
  const Icon = iconMap[icon];
  return <Icon className={className} aria-hidden />;
}
