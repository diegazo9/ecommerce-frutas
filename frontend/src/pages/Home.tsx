import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { getProducts } from '../services/api';
import type { Product } from '../services/api';
import { Loader2, ArrowRight } from 'lucide-react';

export const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError('Error al cargar el catálogo. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-4 bg-white rounded-full shadow-2xl mb-6">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        </div>
        <p className="text-slate-600 font-bold text-lg animate-pulse">Preparando sabores increíbles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 text-red-600 px-8 py-6 rounded-3xl font-bold text-lg border-2 border-red-200 shadow-xl shadow-red-100">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-16 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-vibrant opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30 z-0"></div>
        
        <div className="relative z-10 px-4 sm:px-8 py-16 md:py-32 flex flex-col items-center text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-md text-slate-800 font-bold text-xs sm:text-sm mb-4 sm:mb-6 border border-white/30 shadow-sm">
            NUEVA TEMPORADA 🍉
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-4 sm:mb-6 leading-tight drop-shadow-sm">
            Explosión de <br/><span className="text-gradient">Color y Sabor</span>
          </h1>
          <p className="text-base sm:text-lg md:text-2xl text-slate-800 max-w-2xl font-medium mb-8 sm:mb-10 drop-shadow-sm px-4">
            Tus frutas favoritas con una frescura que salta a la vista. Directo del huerto, llenas de vida.
          </p>
          <button className="btn-gradient text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full flex items-center gap-2 sm:gap-3">
            Ver Colección
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-10 px-2">
        <h2 className="text-3xl font-black text-slate-800">Tendencias Jugosas</h2>
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
          <span className="w-3 h-3 rounded-full bg-blue-400"></span>
          <span className="w-3 h-3 rounded-full bg-pink-400"></span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-emerald-200 shadow-sm">
          <span className="text-6xl mb-4 block">🧐</span>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">¡Nuestra canasta está vacía!</h3>
          <p className="text-slate-500">Aún no hemos agregado productos a la tienda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
