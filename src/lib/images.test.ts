import { describe, expect, it } from "vitest";
import { canOptimize } from "./images";

describe("canOptimize", () => {
  it.each([
    "/images/hero-zaatar.jpg",
    "https://images.unsplash.com/photo-1?w=800",
    "https://abcd1234.supabase.co/storage/v1/object/public/menu/a.jpg",
  ])("lets Next optimise %s", (src) => {
    expect(canOptimize(src)).toBe(true);
  });

  it.each([
    "https://example.com/photo.jpg",
    "https://abcd1234.supabase.co/other/path.jpg",
    "http://images.unsplash.com/photo-1",
    "https://evil.example/images.unsplash.com/x.jpg",
    "//example.com/x.jpg",
    "not a url",
    "",
  ])("serves %s as it is", (src) => {
    expect(canOptimize(src)).toBe(false);
  });
});
