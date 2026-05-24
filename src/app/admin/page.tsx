"use client";

import { useEffect, useState, useRef } from "react";
import { Save, Image as ImageIcon, DollarSign, UploadCloud, Edit3, EyeOff } from "lucide-react";
import type { MenuCategory } from "@/data/menu";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [menuData, setMenuData] = useState<{ categories: MenuCategory[], heroSlides: any[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/menu")
        .then((res) => res.json())
        .then((data) => setMenuData(data));
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("كلمة المرور غير صحيحة (Incorrect password)");
    }
  };

  const handleNameChange = (categoryId: string, itemId: string, lang: 'Ar' | 'En', newName: string) => {
    if (!menuData) return;
    const newCategories = menuData.categories.map((c) => {
      if (c.id !== categoryId) return c;
      return {
        ...c,
        items: c.items.map((item) =>
          item.id === itemId 
            ? { ...item, [lang === 'Ar' ? 'nameAr' : 'nameEn']: newName } 
            : item
        ),
      };
    });
    setMenuData({ ...menuData, categories: newCategories });
  };

  const handlePriceChange = (categoryId: string, itemId: string, newPrice: number) => {
    if (!menuData) return;
    const newCategories = menuData.categories.map((c) => {
      if (c.id !== categoryId) return c;
      return {
        ...c,
        items: c.items.map((item) =>
          item.id === itemId ? { ...item, price: newPrice } : item
        ),
      };
    });
    setMenuData({ ...menuData, categories: newCategories });
  };

  const handleImageChange = (categoryId: string, itemId: string, newImage: string) => {
    if (!menuData) return;
    const newCategories = menuData.categories.map((c) => {
      if (c.id !== categoryId) return c;
      return {
        ...c,
        items: c.items.map((item) =>
          item.id === itemId ? { ...item, image: newImage } : item
        ),
      };
    });
    setMenuData({ ...menuData, categories: newCategories });
  };

  const handleHiddenChange = (categoryId: string, itemId: string, hidden: boolean) => {
    if (!menuData) return;
    const newCategories = menuData.categories.map((c) => {
      if (c.id !== categoryId) return c;
      return {
        ...c,
        items: c.items.map((item) =>
          item.id === itemId ? { ...item, hidden } : item
        ),
      };
    });
    setMenuData({ ...menuData, categories: newCategories });
  };

  const handleAddItem = (categoryId: string) => {
    if (!menuData) return;
    const newItemId = `${categoryId}-${Date.now()}`;
    const newItem = {
      id: newItemId,
      nameEn: "",
      nameAr: "",
      price: 0,
    } as any;
    const newCategories = menuData.categories.map((c) => {
      if (c.id !== categoryId) return c;
      return { ...c, items: [...c.items, newItem] };
    });
    setMenuData({ ...menuData, categories: newCategories });
  };

  // Generic function to handle image uploads
  const performUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  };

  const handleImageUpload = async (categoryId: string, itemId: string, file: File) => {
    setUploadingItem(itemId);
    try {
      const data = await performUpload(file);
      handleImageChange(categoryId, itemId, data.url);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الرفع (Error uploading image)");
    }
    setUploadingItem(null);
  };

  const handleHeroTextChange = (index: number, field: 'titleAr' | 'titleEn', value: string) => {
    if (!menuData) return;
    const newSlides = [...menuData.heroSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setMenuData({ ...menuData, heroSlides: newSlides });
  };

  const handleHeroPriceChange = (index: number, value: number) => {
    if (!menuData) return;
    const newSlides = [...menuData.heroSlides];
    newSlides[index] = { ...newSlides[index], price: value };
    setMenuData({ ...menuData, heroSlides: newSlides });
  };

  const handleHeroImageChange = (index: number, value: string) => {
    if (!menuData) return;
    const newSlides = [...menuData.heroSlides];
    newSlides[index] = { ...newSlides[index], image: value };
    setMenuData({ ...menuData, heroSlides: newSlides });
  };

  const handleHeroImageUpload = async (index: number, file: File) => {
    setUploadingItem(`hero-${index}`);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        handleHeroImageChange(index, data.url);
      } else {
        alert("فشل رفع الصورة (Failed to upload image)");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء الرفع (Error uploading image)");
    }
    setUploadingItem(null);
  };

  const saveChanges = async () => {
    if (!menuData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menuData),
      });
      if (res.ok) {
        alert("تم حفظ التغييرات بنجاح! (Changes saved successfully)");
      } else {
        alert("حدث خطأ أثناء الحفظ");
      }
    } catch (e) {
      alert("حدث خطأ أثناء الحفظ");
    }
    setSaving(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 text-white">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/50 p-8 shadow-xl backdrop-blur-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-amber-500">لوحة تحكم البريوشة</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور (Password: admin123)"
            className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-amber-500"
          />
          <button type="submit" className="w-full rounded-xl bg-amber-500 py-3 font-bold text-black transition-colors hover:bg-amber-400">
            دخول
          </button>
        </form>
      </div>
    );
  }

  if (!menuData) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-amber-500">إدارة المنتجات</h1>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-4xl space-y-12 p-4">
        
        {/* Hero Slides Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold text-amber-100">الصور البارزة (Hero Slides)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {menuData.heroSlides.map((slide, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:border-white/20">
                {/* Name Fields */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <Edit3 className="h-3 w-3" /> العنوان (عربي / إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={slide.titleAr}
                    onChange={(e) => handleHeroTextChange(index, 'titleAr', e.target.value)}
                    placeholder="العنوان بالعربي"
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={slide.titleEn}
                    onChange={(e) => handleHeroTextChange(index, 'titleEn', e.target.value)}
                    placeholder="Title in English"
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                
                {/* Price Field */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <DollarSign className="h-3 w-3" /> السعر بالدينار
                  </label>
                  <input
                    type="number"
                    value={slide.price}
                    onChange={(e) => handleHeroPriceChange(index, Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>

                {/* Image Field & Upload */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <ImageIcon className="h-3 w-3" /> رابط أو رفع صورة
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slide.image || ""}
                      onChange={(e) => handleHeroImageChange(index, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                    <label className="flex cursor-pointer items-center justify-center rounded-lg bg-white/10 p-2 transition hover:bg-white/20">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleHeroImageUpload(index, e.target.files[0]);
                          }
                        }}
                      />
                      {uploadingItem === `hero-${index}` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      ) : (
                        <UploadCloud className="h-4 w-4 text-amber-500" />
                      )}
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {slide.image && (
                  <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg bg-white/5 border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.image} alt="" className="h-full w-full object-cover opacity-80 transition hover:opacity-100" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {menuData.categories.map((category) => (
          <section key={category.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-amber-100">{category.titleAr}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:border-white/20">
                  
                  {/* Name Fields */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <Edit3 className="h-3 w-3" /> الاسم (عربي / إنجليزي)
                    </label>
                    <input
                      type="text"
                      value={item.nameAr}
                      onChange={(e) => handleNameChange(category.id, item.id, 'Ar', e.target.value)}
                      placeholder="الاسم بالعربي"
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={item.nameEn}
                      onChange={(e) => handleNameChange(category.id, item.id, 'En', e.target.value)}
                      placeholder="Name in English"
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  
                  {/* Price Field */}
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <DollarSign className="h-3 w-3" /> السعر بالدينار
                    </label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handlePriceChange(category.id, item.id, Number(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Image Field and Upload */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <ImageIcon className="h-3 w-3" /> رابط أو رفع صورة
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={item.image || ""}
                        onChange={(e) => handleImageChange(category.id, item.id, e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none focus:border-amber-500"
                      />
                      <label className="flex cursor-pointer items-center justify-center rounded-lg bg-white/10 p-2 transition hover:bg-white/20">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(category.id, item.id, e.target.files[0]);
                            }
                          }}
                        />
                        {uploadingItem === item.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                        ) : (
                          <UploadCloud className="h-4 w-4 text-amber-500" />
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Hidden toggle */}
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <EyeOff className="h-3 w-3" /> إخفاء
                    </label>
                    <input
                      type="checkbox"
                      checked={item.hidden || false}
                      onChange={(e) => handleHiddenChange(category.id, item.id, e.target.checked)}
                      className="h-4 w-4 rounded border border-white/20 bg-black/30 text-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  {/* Image Preview */}
                  {item.image && (
                    <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg bg-white/5 border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-full w-full object-cover opacity-80 transition hover:opacity-100" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleAddItem(category.id)}
                className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-black hover:bg-amber-400"
              >
                إضافة عنصر
              </button>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
