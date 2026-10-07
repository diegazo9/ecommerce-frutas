import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Check, Scale, Eye } from 'lucide-react';
import type { Product } from '../services/api';
import { useCart } from '../context/CartContext';
import { ComboDetailModal } from './ComboDetailModal';

interface ProductCardProps {
  product: Product;
  onOpenDetail?: (product: Product) => void;
  allProducts?: Product[];
}

export const ProductCard = ({ product, onOpenDetail, allProducts }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const hoverTimerRef = useRef<any>(null);

  // Limpiar timer de hover al desmontar
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Detección de combos o bolsones
  const isCombo = 
    product.name.toLowerCase().includes('combo') ||
    product.name.toLowerCase().includes('bolsón') ||
    product.name.toLowerCase().includes('bolson') ||
    product.name.toLowerCase().includes('pack') ||
    Boolean(product.category?.name?.toLowerCase().includes('combo') ||
    product.category?.name?.toLowerCase().includes('bolson') ||
    product.category?.name?.toLowerCase().includes('bolsón'));

  const handleOpenDetail = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (onOpenDetail) {
      onOpenDetail(product);
    } else {
      setInternalModalOpen(true);
    }
  };

  // Formatos disponibles según la unidad del producto
  const isKiloProduct = product.unit === 'kg' || !product.unit;

  const kiloOptions = [
    { id: 'medio', label: '1/2 kg', factor: 0.5, desc: 'Medio Kilo (500g)' },
    { id: 'kilo', label: '1 kg', factor: 1.0, desc: '1 Kilo' },
    { id: 'dos_kilos', label: '2 kg', factor: 2.0, desc: '2 Kilos' },
    { id: 'unidad', label: '1 unid.', factor: 0.25, desc: '1 Unidad (aprox. 250g)' },
  ];

  const unitOptions = [
    { id: '1und', label: '1 unid.', factor: 1.0, desc: '1 Unidad' },
    { id: '2und', label: '2 unid.', factor: 2.0, desc: '2 Unidades' },
    { id: '3und', label: '3 unid.', factor: 3.0, desc: '3 Unidades' },
    { id: '6und', label: '6 unid.', factor: 6.0, desc: 'Media Docena (6)' },
  ];

  const options = isKiloProduct ? kiloOptions : unitOptions;
  const [selectedOption, setSelectedOption] = useState(options[1] || options[0]);

  const calculatedPrice = Number(product.price) * selectedOption.factor;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isUnit = selectedOption.id === 'unidad' || !isKiloProduct;
    const factor = isKiloProduct ? (selectedOption.id === 'unidad' ? 0.25 : 0.5) : 1.0;
    const count = isKiloProduct 
      ? (selectedOption.id === 'unidad' ? 1 : Math.round(selectedOption.factor / 0.5))
      : Math.round(selectedOption.factor);

    addToCart(
      product, 
      selectedOption.factor, 
      selectedOption.desc, 
      isUnit ? 'unit' : 'kg',
      count,
      factor
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <>
      <div className="card-hover bg-white rounded-3xl overflow-hidden flex flex-col group border border-emerald-100/80 relative shadow-xs hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-100/30 via-transparent to-rose-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
        
        {/* Imagen: al hacer click o hover abre el modal de detalle */}
        <div 
          onClick={handleOpenDetail}
          className="relative aspect-square overflow-hidden bg-slate-50 p-5 z-10 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          
          <img 
            src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=16a34a&color=fff&size=512`} 
            alt={product.name} 
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=16a34a&color=fff&size=512`; }}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-108 transition-transform duration-700 ease-out shadow-xs"
          />

          {/* Badge de Categoría */}
          {product.category && (
            <span className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black text-emerald-700 shadow-xs z-20 border border-emerald-100">
              🌿 {product.category.name}
            </span>
          )}

          {/* Badge Del Día */}
          <span className="absolute top-3.5 right-3.5 bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1 z-20">
            ☀️ Del Día
          </span>

          {/* Overlay interactivo visible en hover para TODOS los productos */}
          <div className="absolute inset-x-4 bottom-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div 
              onMouseEnter={() => {
                // Al pasar el mouse y mantenerse brevemente en el botón de vista rápida, se abre el modal
                hoverTimerRef.current = setTimeout(() => {
                  handleOpenDetail();
                }, 450);
              }}
              onMouseLeave={() => {
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail();
              }}
              className="bg-emerald-950/90 hover:bg-emerald-800 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xl border border-emerald-400/40 backdrop-blur-md cursor-pointer hover:scale-105 transition-all"
            >
              <Eye className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{isCombo ? 'Ver qué incluye el combo' : 'Vista Rápida / Ver Detalle'}</span>
            </div>
          </div>
        </div>
        
        <div className="p-5 flex flex-col flex-grow z-10 bg-white">
          <h3 
            onClick={handleOpenDetail}
            className="font-black text-lg text-slate-800 mb-1 leading-tight group-hover:text-emerald-600 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-slate-500 text-xs line-clamp-2 mb-3 font-medium">
            {product.description}
          </p>

          {/* Botón destacado "Ver qué incluye" específico para combos */}
          {isCombo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail();
              }}
              className="w-full mb-3 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border border-emerald-200/80 shadow-2xs group/btn cursor-pointer hover:scale-[1.01]"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:scale-125 transition-transform" />
              <span>Ver qué incluye (fotos y cantidades)</span>
            </button>
          )}

          {/* Botón de vista rápida sutil para productos regulares */}
          {!isCombo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail();
              }}
              className="w-full mb-3 py-1.5 px-3 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              <span>Ver detalle y formatos</span>
            </button>
          )}
          
          {/* Selector de Cantidad / Formato */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mb-2">
              <Scale className="w-3.5 h-3.5 text-emerald-500" />
              <span>Selecciona cantidad:</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOption(opt);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedOption.id === opt.id
                      ? 'bg-emerald-600 text-white shadow-sm scale-100'
                      : 'text-slate-600 hover:bg-white hover:text-emerald-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 text-center">
              {selectedOption.desc}
            </p>
          </div>

          {/* Precio y Botón de compra */}
          <div className="flex items-end justify-between mt-auto pt-2 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total estimado</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">${calculatedPrice.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={handleAddToCart}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isAdded 
                  ? 'bg-emerald-500 text-white scale-105 shadow-md shadow-emerald-500/30' 
                  : 'btn-gradient shadow-xs hover:shadow-md'
              }`}
              title="Añadir al carrito"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 animate-in zoom-in" />
                  <span>¡Listo!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Agregar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalle para cualquier producto */}
      {internalModalOpen && (
        <ComboDetailModal 
          product={product} 
          onClose={() => setInternalModalOpen(false)} 
          allProducts={allProducts}
        />
      )}
    </>
  );
};
