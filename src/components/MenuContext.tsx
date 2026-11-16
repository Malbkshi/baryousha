"use client";

import { createContext, useContext } from "react";
import type { MenuData } from "@/data/menu";

const MenuContext = createContext<MenuData | null>(null);

export function MenuProvider({
  menu,
  children,
}: {
  menu: MenuData;
  children: React.ReactNode;
}) {
  return <MenuContext.Provider value={menu}>{children}</MenuContext.Provider>;
}

/** The menu the server rendered this page with. */
export function useMenu(): MenuData {
  const menu = useContext(MenuContext);
  if (!menu) throw new Error("useMenu must be used inside <MenuProvider>");
  return menu;
}
