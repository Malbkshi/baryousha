import { MenuApp } from "@/components/MenuApp";
import { MenuProvider } from "@/components/MenuContext";
import { getMenu, publicMenu } from "@/lib/menu/getMenu";

// Rebuilt at most once a minute; saving from the dashboard refreshes it at once.
export const revalidate = 60;

export default async function Home() {
  const menu = publicMenu(await getMenu());

  return (
    <div className="mx-auto min-h-full w-full">
      <MenuProvider menu={menu}>
        <MenuApp />
      </MenuProvider>
    </div>
  );
}
