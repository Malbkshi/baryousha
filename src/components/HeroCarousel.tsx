"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { heroSlides } from "@/data/menu";
import { formatPrice } from "@/lib/formatPrice";
import { MapPin } from "lucide-react";

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("init", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("init", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 pt-6">
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/50 px-3 py-1.5 text-xs text-amber-100 backdrop-blur-sm">
          <MapPin className="h-3.5 w-3.5 text-amber-400" />
          <span>طرابلس، ليبيا</span>
        </div>
        <p className="text-[10px] tracking-[0.2em] text-amber-400/80 uppercase">
          ALBARYOSHA
        </p>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.image}
              className="relative min-w-0 shrink-0 grow-0 basis-full"
            >
              <div className="relative aspect-[4/5] max-h-[52vh] w-full sm:aspect-[16/10] sm:max-h-[58vh] lg:aspect-[21/9] lg:max-h-[40vh]">
                <Image
                  src={slide.image}
                  alt={slide.titleAr}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 950px"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-8">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  مقهى البريوشة
                </h1>
                <p className="mt-1 text-sm text-amber-200/90">{slide.titleAr}</p>
                <p className="text-xs text-zinc-400">{slide.titleEn}</p>
                <span className="mt-3 inline-block rounded-full bg-amber-500 px-4 py-1 text-sm font-bold text-black">
                  {formatPrice(slide.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`الشريحة ${index + 1}`}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === selectedIndex
                ? "w-6 bg-amber-400"
                : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
