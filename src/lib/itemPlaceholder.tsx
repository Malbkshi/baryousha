import type { MenuItem } from "@/data/menu";

const placeholders: Record<string, string> = {
  c: "🥐",
  m: "🥤",
  j: "🧃",
  jL: "🧃",
  cf: "☕",
  a: "🥑",
  y: "🥛",
};

export function ItemPlaceholder({ item }: { item: MenuItem }) {
  const prefix = item.id.replace(/\d+$/, "");
  const emoji = placeholders[prefix] ?? "✨";
  return <span className="text-3xl opacity-70">{emoji}</span>;
}
