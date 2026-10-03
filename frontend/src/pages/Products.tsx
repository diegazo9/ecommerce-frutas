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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="pb-16">
      <h1 className="text-4xl font-black text-slate-800 mb-10 px-2">Catálogo Completo</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};
