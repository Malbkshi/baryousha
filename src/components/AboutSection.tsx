import { Croissant, Truck, MapPin, Phone } from "lucide-react";

export function AboutSection() {
  return (
    <section
      id="about"
      className="mx-4 mt-8 rounded-2xl border border-amber-600/20 bg-zinc-900/60 p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <Croissant className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-bold text-amber-100">عن المقهى</h2>
      </div>
      <p className="leading-relaxed text-zinc-300">
        مقهى البريوشة في طرابلس — بريوش طرابلسي أصلي، فروبي، عصائر طازجة، وقهوة.
        الطعم الطرابلسي الأصلي في كل قطعة.
      </p>
      <p className="mt-2 mb-6 text-sm text-zinc-500">
        Albaryosha Café · Tripoli, Libya — croissants, milkshakes, fresh juices & coffee.
      </p>

      <div className="mb-6 space-y-4 rounded-xl bg-black/40 p-4 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-200">العنوان</span>
            <span className="text-xs text-zinc-400">طرابلس، السياحية</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Phone className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-200">رقم الهاتف</span>
            <span dir="ltr" className="text-xs font-bold text-amber-500">091 123 4567</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-500">
        <Truck className="h-4 w-4 shrink-0" />
        <span>التوصيل قريباً</span>
      </div>
    </section>
  );
}
