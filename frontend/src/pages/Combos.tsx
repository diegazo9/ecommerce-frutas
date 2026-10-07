import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ComboDetailModal } from '../components/ComboDetailModal';
import { getProducts, getCategories } from '../services/api';
import type { Product, Category } from '../services/api';
import { Loader2, Sparkles, ShieldCheck, Truck, HeartHandshake, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Combos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState<Product | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Promise.all([getProducts(), getCategories()])
      .then(([prodData, catData]) => {
        setProducts(prodData || []);
        setCategories(catData || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const comboCategory = categories.find(c => 
    c.name.toLowerCase().includes('combo') || 
    c.name.toLowerCase().includes('bolson') ||
    c.name.toLowerCase().includes('bolsón')
  );

  const comboProducts = products.filter(p => 
    (comboCategory && p.categoryId === comboCategory.id) ||
    p.name.toLowerCase().includes('combo') ||
    p.name.toLowerCase().includes('bolsón') ||
    p.name.toLowerCase().includes('bolson') ||
    p.name.toLowerCase().includes('pack')
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-5 bg-gradient-to-tr from-amber-100 via-rose-100 to-emerald-100 rounded-full shadow-xl mb-4 animate-bounce">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
        <p className="text-emerald-800 font-black text-lg">Cargando los mejores bolsones y combos... 🧺</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Combos Hero Header */}
      <div className="relative rounded-[3rem] overflow-hidden mb-12 shadow-2xl border-4 border-white/60 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-8 sm:p-14 lg:p-16">
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop')` }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/15 backdrop-blur-md text-amber-300 font-black text-xs sm:text-sm mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>BOLSONES Y COMBOS SEMANALES</span>
            <span>·</span>
            <span className="text-emerald-300">¡AHORRÁ HASTA 25%!</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Combos del Huerto, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200">
              Listos para tu Mesa 🧺
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 font-medium mb-8 leading-relaxed max-w-2xl">
            Diseñados para familias, deportistas y amantes de la vida sana. Los mejores surtidos de frutas de estación, cítricos jugosos y hojas verdes crujientes, directo del productor a tu puerta.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/15">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-emerald-300">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Envíos en el Día</p>
                <p className="text-[11px] text-slate-300">Cosechado hoy mismo</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-amber-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Calidad Garantizada</p>
                <p className="text-[11px] text-slate-300">100% fresco o te lo cambiamos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-rose-300">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">Ahorro Familiar</p>
                <p className="text-[11px] text-slate-300">Mejor precio por volumen</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Combo Products */}
      <div className="mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Surtidos Seleccionados</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Elegí tu Combo de la Semana</h2>
          </div>
          <Link
            to="/#catalogo"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-all w-fit"
          >
            <span>Ver Todo el Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {comboProducts.length === 0 ? (
          <div className="text-center py-16 bg-emerald-50/50 rounded-3xl border border-emerald-100">
            <p className="text-slate-600 font-bold mb-4">No se encontraron combos disponibles en este momento.</p>
            <Link to="/" className="btn-gradient text-white px-6 py-2.5 rounded-full text-sm font-bold">
              Ir a la Frutería
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {comboProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOpenDetail={setSelectedCombo}
                allProducts={products}
              />
            ))}
          </div>
        )}
      </div>

      {/* Custom Combo / Wholesale Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            ¿Buscás un bolsón personalizado?
          </span>
          <h3 className="text-2xl sm:text-3xl font-black">Armamos bolsones a medida para tu empresa o consorcio</h3>
          <p className="text-white/85 text-sm sm:text-base max-w-xl">
            Consultá por pedidos semanales recurrentes, canastas corporativas de frutas saludables y precios especiales por cantidad.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <a
            href="https://wa.me/5491100000000?text=Hola!%20Quisiera%20consultar%20por%20un%20bolsón%20personalizado%20o%20combo%20especial."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-emerald-800 hover:bg-emerald-50 px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>Pedir por WhatsApp</span>
          </a>
          <Link
            to="/mayorista"
            className="bg-black/20 hover:bg-black/30 text-white border border-white/30 px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center transition-all"
          >
            <span>Ver Sección Mayorista</span>
          </Link>
        </div>
      </div>

      {/* Ventana emergente (Modal) con el detalle del combo */}
      <ComboDetailModal 
        combo={selectedCombo} 
        onClose={() => setSelectedCombo(null)} 
        allProducts={products} 
      />
    </div>
  );
};
