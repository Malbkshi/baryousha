import Image from "next/image";
import { heroSlides } from "@/data/menu";
import { formatPrice } from "@/lib/formatPrice";

export function FeaturedCroissants() {
  return (
    <section className="px-4">
      <h3 className="mb-3 text-sm font-medium text-amber-200/80">
        الأكثر طلباً
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {heroSlides.map((slide) => (
          <article
            key={slide.image}
            className="overflow-hidden rounded-xl border border-amber-600/30 bg-zinc-900/80"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={slide.image}
                alt={slide.titleAr}
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-white">{slide.titleAr}</p>
              <p className="text-[10px] text-zinc-500">{slide.titleEn}</p>
              <p className="mt-1 text-xs font-bold text-amber-400">
                {formatPrice(slide.price)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
