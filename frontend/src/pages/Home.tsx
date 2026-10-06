import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { getProducts, getCategories } from '../services/api';
import type { Product, Category } from '../services/api';
import { Loader2, ArrowRight, Sun, Truck, ShieldCheck, Sparkles, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, catData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(prodData);
        setCategories(catData);
      } catch (err) {
        setError('Error al cargar los productos de primavera. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = selectedCategory === null 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-5 bg-gradient-to-tr from-amber-100 via-rose-100 to-emerald-100 rounded-full shadow-xl mb-4 animate-bounce">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
        <p className="text-emerald-800 font-black text-lg">Cosechando frutas frescas de primavera... 🌸</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-rose-50 text-rose-700 px-8 py-6 rounded-3xl font-bold text-lg border-2 border-rose-200 shadow-xl shadow-rose-100/50">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Spring Joyful Hero Section */}
      <div className="relative rounded-[3rem] overflow-hidden mb-12 shadow-2xl border-4 border-white/60 bg-spring-hero">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-25 pointer-events-none"></div>
        
        <div className="relative z-10 px-6 sm:px-12 py-16 sm:py-24 md:py-28 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Spring Badge */}
          <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-white/90 backdrop-blur-md text-emerald-800 font-black text-xs sm:text-sm mb-6 border border-emerald-200 shadow-sm animate-spring">
            <span>🌸</span>
            <span>TEMPORADA PRIMAVERA 2026</span>
            <span>·</span>
            <span className="text-rose-600">COSECHA DEL DÍA 🍓</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
            Frutas del Huerto, <br/>
            <span className="text-gradient">Llenas de Sol y Alegría 🌻</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-xl md:text-2xl text-slate-700 font-medium mb-10 max-w-2xl leading-relaxed">
            Descubre los sabores más dulces, jugosos y radiantes de la estación. 
            Directo de la planta a tu hogar, con aroma y frescura insuperables.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button 
              type="button"
              onClick={() => {
                const el = document.getElementById('catalogo');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="btn-gradient text-white font-black text-base sm:text-lg px-8 py-4 rounded-full flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto cursor-pointer hover:scale-102 active:scale-98 transition-all"
            >
              <span>Explorar Frutería 🍓</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link 
              to="/envios" 
              className="bg-white/80 hover:bg-white text-emerald-800 hover:text-emerald-900 font-black text-base sm:text-lg px-7 py-4 rounded-full flex items-center justify-center gap-2 border border-emerald-200 shadow-sm transition-all w-full sm:w-auto hover:shadow-md"
            >
              <span>Zonas de Entrega 🛵</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Spring Benefits Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 px-2">
        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-emerald-100 flex items-center gap-3.5 shadow-2xs hover:scale-105 transition-transform">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">100% Huerta Natural</h4>
            <p className="text-slate-500 text-xs font-medium">Frutas sanas y vivas</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-amber-100 flex items-center gap-3.5 shadow-2xs hover:scale-105 transition-transform">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Maduradas al Sol</h4>
            <p className="text-slate-500 text-xs font-medium">Dulzura auténtica</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-rose-100 flex items-center gap-3.5 shadow-2xs hover:scale-105 transition-transform">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Envíos en el Día</h4>
            <p className="text-slate-500 text-xs font-medium">Máxima frescura en casa</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-teal-100 flex items-center gap-3.5 shadow-2xs hover:scale-105 transition-transform">
          <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Mercado Pago</h4>
            <p className="text-slate-500 text-xs font-medium">Pagos 100% seguros</p>
          </div>
        </div>
      </div>

      {/* Catalog Section Header with Interactive Category Filter */}
      <div id="catalogo" className="mb-10 px-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" /> Cosecha Seleccionada
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Nuestros Frutos de Primavera 🌸
            </h2>
          </div>
          <span className="text-slate-500 text-sm font-semibold">
            {filteredProducts.length} variedades disponibles
          </span>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2.5 rounded-full font-black text-xs transition-all whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-105'
                : 'bg-white text-slate-700 border border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            🍓 Todas las frutas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full font-black text-xs transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-105'
                  : 'bg-white text-slate-700 border border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              🌿 {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-white/90 rounded-[2.5rem] border-2 border-dashed border-emerald-200 shadow-sm">
          <span className="text-6xl mb-4 block">🧺</span>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">No hay productos en esta categoría</h3>
          <p className="text-slate-500">Prueba seleccionando otra categoría o todas las frutas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
