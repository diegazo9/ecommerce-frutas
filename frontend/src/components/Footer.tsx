import { Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 mt-auto border-t-[8px] border-emerald-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-tr from-emerald-400 to-blue-500 p-2 rounded-xl text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">VibranFrut</span>
            </div>
            <p className="text-sm leading-relaxed font-medium">
              Revolucionamos la forma de comer frutas. Frescura extrema, colores vivos y un sabor que te hará vibrar, directo del campo a tu puerta.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-6 tracking-wide text-lg">Descubre</h3>
            <ul className="space-y-3 font-medium">
              <li><a href="/" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Catálogo Exclusivo</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Nuestra Historia</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span> Únete al equipo</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-6 tracking-wide text-lg">Contacto</h3>
            <ul className="space-y-3 font-medium">
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg"><span className="text-emerald-400">@</span></div>
                hola@vibranfrut.com
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-2 rounded-lg"><span className="text-emerald-400">#</span></div>
                +1 800 JUGOSAS
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-medium">
          <p>&copy; {new Date().getFullYear()} VibranFrut Inc. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Términos</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
