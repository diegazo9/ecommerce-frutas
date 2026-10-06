import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { getProducts, getCategories } from '../services/api';
import type { Product, Category } from '../services/api';
import { Loader2, ArrowRight, Sun, Truck, ShieldCheck, Sparkles, Sprout, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const citricosCat = categories.find(c => c.name.toLowerCase().includes('cítrico') || c.name.toLowerCase().includes('citrico'));
  const hojasCat = categories.find(c => c.name.toLowerCase().includes('hoja') || c.name.toLowerCase().includes('verdura'));

  const scrollToCatalog = (categoryId?: number | null) => {
    if (categoryId !== undefined) {
      setSelectedCategory(categoryId);
    }
    const el = document.getElementById('catalogo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const slides = [
    {
      id: 1,
      badgeText: 'TEMPORADA PRIMAVERA 2026',
      badgeSub: 'COSECHA DEL DÍA 🍓',
      badgeIcon: '🌸',
      title: 'Frutas del Huerto,',
      highlight: 'Llenas de Sol y Alegría 🌻',
      desc: 'Descubre los sabores más dulces, jugosos y radiantes de la estación. Directo de la planta a tu hogar, con aroma y frescura insuperables.',
      bgImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2000&auto=format&fit=crop',
      accentGradients: 'from-amber-300/35 via-rose-300/25 to-emerald-300/35',
      btnPrimary: { text: 'Explorar Frutería 🍓', onClick: () => scrollToCatalog(null) },
      btnSecondary: { text: 'Zonas de Entrega 🛵', to: '/envios' }
    },
    {
      id: 2,
      badgeText: 'COMBO HUERTO FAMILIAR',
      badgeSub: '¡AHORRÁ HASTA 25%! 🧺',
      badgeIcon: '🧺',
      title: 'Bolsón Huerto Familiar,',
      highlight: 'Frutas y Verduras Frescas 🥑',
      desc: 'El mix más completo y rendidor: manzanas crujientes, cítricos de jugo, hojas verdes frescas y papas de campo para toda la semana.',
      bgImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop',
      accentGradients: 'from-emerald-400/35 via-teal-300/25 to-amber-300/35',
      btnPrimary: { text: 'Ver Catálogo Completo 🧺', onClick: () => scrollToCatalog(null) },
      btnSecondary: { text: 'Precios Mayoristas 📦', to: '/mayorista' }
    },
    {
      id: 3,
      badgeText: 'PACK ENERGÍA & VITALIDAD',
      badgeSub: 'VITAMINA C PURA ⚡',
      badgeIcon: '🍊',
      title: 'Pack Jugos y Cítricos,',
      highlight: 'Naranjas, Limones y Pomelos 🍹',
      desc: 'Naranjas de zumo extra jugosas, pomelos rosados refrescantes y limones aromáticos para comenzar el día con máxima vitalidad.',
      bgImage: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?q=80&w=2000&auto=format&fit=crop',
      accentGradients: 'from-orange-400/35 via-amber-300/30 to-yellow-300/35',
      btnPrimary: { text: 'Ver Cítricos de Huerta 🍊', onClick: () => scrollToCatalog(citricosCat ? citricosCat.id : null) },
      btnSecondary: { text: 'Recetas con Cítricos 🍹', to: '/recetas' }
    },
    {
      id: 4,
      badgeText: 'PACK VERDE SALUDABLE',
      badgeSub: '100% ORGÁNICO 🌱',
      badgeIcon: '🥗',
      title: 'Bolsón Hojas Verdes,',
      highlight: 'Espinaca, Rúcula y Acelga 🌿',
      desc: 'Hojas tiernas y crujientes ricas en hierro, cosechadas esta mañana y listas para tus mejores ensaladas de huerto.',
      bgImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=2000&auto=format&fit=crop',
      accentGradients: 'from-emerald-500/35 via-green-300/30 to-lime-300/35',
      btnPrimary: { text: 'Ver Verduras de Hoja 🥗', onClick: () => scrollToCatalog(hojasCat ? hojasCat.id : null) },
      btnSecondary: { text: 'Zonas de Entrega 🛵', to: '/envios' }
    }
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <div className="pb-20">
      {/* Dynamic Rotating Banner / Combos Hero Carousel */}
      <div 
        className="relative rounded-[3rem] overflow-hidden mb-12 shadow-2xl border-4 border-white/60 min-h-[500px] sm:min-h-[520px] md:min-h-[540px] flex items-center bg-spring-hero"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slides */}
        {slides.map((slide, index) => {
          const isActive = currentSlide === index;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out flex items-center justify-center ${
                isActive 
                  ? 'opacity-100 scale-100 z-10 pointer-events-auto' 
                  : 'opacity-0 scale-95 z-0 pointer-events-none'
              }`}
            >
              {/* Background image & gradient overlay */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out mix-blend-overlay opacity-30"
                style={{ backgroundImage: `url('${slide.bgImage}')` }}
              />
              <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${slide.accentGradients} rounded-full blur-3xl pointer-events-none`} />
              <div className={`absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr ${slide.accentGradients} rounded-full blur-3xl pointer-events-none`} />

              {/* Slide Content */}
              <div className="relative z-10 px-8 sm:px-16 py-14 sm:py-20 md:py-24 flex flex-col items-center text-center max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-white/95 backdrop-blur-md text-emerald-800 font-black text-xs sm:text-sm mb-6 border border-emerald-200 shadow-sm animate-spring">
                  <span>{slide.badgeIcon}</span>
                  <span>{slide.badgeText}</span>
                  <span>·</span>
                  <span className="text-rose-600">{slide.badgeSub}</span>
                </div>

                {/* Heading */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-5 leading-[1.15]">
                  {slide.title} <br/>
                  <span className="text-gradient">{slide.highlight}</span>
                </h1>

                {/* Description */}
                <p className="text-sm sm:text-lg md:text-xl text-slate-700 font-medium mb-8 max-w-2xl leading-relaxed">
                  {slide.desc}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <button 
                    type="button"
                    onClick={slide.btnPrimary.onClick}
                    className="btn-gradient text-white font-black text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-3 shadow-lg w-full sm:w-auto cursor-pointer hover:scale-102 active:scale-98 transition-all"
                  >
                    <span>{slide.btnPrimary.text}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link 
                    to={slide.btnSecondary.to}
                    className="bg-white/85 hover:bg-white text-emerald-800 hover:text-emerald-900 font-black text-sm sm:text-base px-7 py-3.5 sm:py-4 rounded-full flex items-center justify-center gap-2 border border-emerald-200 shadow-sm transition-all w-full sm:w-auto hover:shadow-md"
                  >
                    <span>{slide.btnSecondary.text}</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Arrow: Prev */}
        <button
          type="button"
          onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-emerald-700 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-md border border-white/60 cursor-pointer"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Navigation Arrow: Next */}
        <button
          type="button"
          onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-emerald-700 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-md border border-white/60 cursor-pointer"
          aria-label="Siguiente slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/65 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80 shadow-md">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-300 rounded-full h-2.5 sm:h-3 cursor-pointer ${
                currentSlide === idx
                  ? 'w-7 sm:w-9 bg-emerald-600 shadow-xs'
                  : 'w-2.5 sm:w-3 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Ir a ${s.badgeText}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
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
