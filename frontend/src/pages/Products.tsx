import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { getProducts } from '../services/api';
import type { Product } from '../services/api';
import { Loader2 } from 'lucide-react';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const inStockProducts = products.filter(p => Number(p.stock) > 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="pb-16">
      <h1 className="text-4xl font-black text-slate-800 mb-10 px-2">Catálogo Completo</h1>
      {inStockProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-xl mx-auto p-8">
          <span className="text-5xl block mb-3">🧺</span>
          <h2 className="text-xl font-black text-slate-700 mb-2">No hay productos en stock actualmente</h2>
          <p className="text-sm text-slate-500">Estamos cosechando y reponiendo mercadería fresca. ¡Vuelve a consultar pronto!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {inStockProducts.map(p => <ProductCard key={p.id} product={p} allProducts={inStockProducts} />)}
        </div>
      )}
    </div>
  );
};
