import Image from "next/image";
import { heroSlides } from "@/data/menu";
import { formatPrice } from "@/lib/formatPrice";
import { Reveal } from "./Reveal";

export function FeaturedCroissants() {
  return (
    <section className="px-4">
      <h3 className="mb-3 text-sm font-medium text-amber-200/80">
        الأكثر طلباً
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {heroSlides.map((slide, index) => (
          <Reveal key={slide.image} delay={index * 60} className="h-full">
          <article
            className="group h-full overflow-hidden rounded-xl border border-amber-600/30 bg-zinc-900/80 transition duration-200 ease-brand hover:scale-[1.02] hover:border-amber-500/50"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={slide.image}
                alt={slide.titleAr}
                fill
                className="object-cover transition-transform duration-500 ease-brand group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 240px"
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
          </Reveal>
        ))}
      </div>
    </section>
  );
}
