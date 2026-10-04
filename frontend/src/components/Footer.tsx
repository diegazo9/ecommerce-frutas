import { Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-emerald-950 text-emerald-100/70 py-16 mt-auto border-t-4 border-amber-400 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-tr from-emerald-400 via-lime-400 to-amber-300 p-2.5 rounded-2xl text-emerald-950 shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <span className="font-black text-2xl text-white tracking-tight">VibranFrut</span>
                <span className="block text-[10px] uppercase font-black tracking-widest text-amber-300">Huerto de Primavera 🌸</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed font-medium text-emerald-100/80">
              Llevamos la vitalidad de la naturaleza directo a tu mesa. Frutas y verduras frescas, cultivadas con cariño y cosechadas en su punto perfecto de maduración.
            </p>
          </div>
          <div>
            <h3 className="text-white font-black mb-6 tracking-wide text-base uppercase text-emerald-300">Explorar</h3>
            <ul className="space-y-3 font-semibold text-sm">
              <li><a href="/" className="hover:text-amber-300 transition-colors flex items-center gap-2"><span>🍓</span> Catálogo de Frutas</a></li>
              <li><a href="/nosotros" className="hover:text-amber-300 transition-colors flex items-center gap-2"><span>🌱</span> Nuestro Huerto</a></li>
              <li><a href="/envios" className="hover:text-amber-300 transition-colors flex items-center gap-2"><span>🛵</span> Zonas de Entrega</a></li>
              <li><a href="/recetas" className="hover:text-amber-300 transition-colors flex items-center gap-2"><span>🥑</span> Recetas Primaverales</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-black mb-6 tracking-wide text-base uppercase text-emerald-300">Atención & Envíos</h3>
            <ul className="space-y-3 font-medium text-sm">
              <li className="flex items-center gap-3">
                <span className="text-xl">🌸</span>
                <span>Envíos todos los días de 8:00 a 20:00</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-xl">💳</span>
                <span>Pagos con Mercado Pago o Efectivo</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <span>Entrega rápida y refrigerada</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-900 mt-14 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-emerald-300/80">
          <p>&copy; {new Date().getFullYear()} VibranFrut · Cosecha de Primavera. Todos los derechos reservados.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer transition-colors">Garantía de Frescura 🌿</span>
            <span className="hover:text-white cursor-pointer transition-colors">Términos & Condiciones</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
