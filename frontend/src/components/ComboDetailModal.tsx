import { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, Sparkles, Truck, ShieldCheck, Leaf, Scale } from 'lucide-react';
import type { Product } from '../services/api';
import { useCart } from '../context/CartContext';

export interface ComboItem {
  name: string;
  quantity: string;
  benefit?: string;
  imageUrl: string;
}

export const getComboItems = (combo: Product, allProducts: Product[] = []): ComboItem[] => {
  const name = combo.name.toLowerCase();

  // 1. Bolsón Huerto Familiar (8 kg)
  if (name.includes('huerto familiar') || name.includes('familiar')) {
    return [
      {
        name: 'Manzana Roja',
        quantity: '2 kg',
        benefit: 'Dulces, jugosas y crujientes de estación',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=500&q=80'
      },
      {
        name: 'Naranja de Jugo',
        quantity: '2 kg',
        benefit: 'Extra jugosas, ideales para exprimir cada mañana',
        imageUrl: 'https://images.unsplash.com/photo-1549888834-3ec93abae044?w=500&q=80'
      },
      {
        name: 'Plátano Cavendish',
        quantity: '1 kg',
        benefit: 'Bananas maduras en su punto justo de dulzura',
        imageUrl: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=500&q=80'
      },
      {
        name: 'Papa Blanca de Campo',
        quantity: '1 kg',
        benefit: 'Papas seleccionadas para puré, horno o fritas',
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b14fa7e656d7?w=500&q=80'
      },
      {
        name: 'Zanahorias Frescas',
        quantity: '1 kg',
        benefit: 'Crocantes y dulces con hojas frescas de huerta',
        imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80'
      },
      {
        name: 'Espinaca Fresca',
        quantity: '1 atado',
        benefit: 'Hojas tiernas y verdes oscuras ricas en hierro',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80'
      }
    ];
  }

  // 2. Pack Cítricos & Zumos Detox (5 kg)
  if (name.includes('cítricos') || name.includes('citricos') || name.includes('detox') || name.includes('zumos')) {
    return [
      {
        name: 'Naranjas de Jugo Extra Dulces',
        quantity: '2.5 kg',
        benefit: 'Cítricos seleccionados con máxima pulpa y dulzor',
        imageUrl: 'https://images.unsplash.com/photo-1549888834-3ec93abae044?w=500&q=80'
      },
      {
        name: 'Pomelos Rosados',
        quantity: '1.5 kg',
        benefit: 'Toque refrescante, antioxidante y purificante',
        imageUrl: 'https://images.unsplash.com/photo-1558500259-3610e75a8968?w=500&q=80'
      },
      {
        name: 'Limones Amarillos',
        quantity: '1 kg',
        benefit: 'Aroma cítrico intenso y acidez perfecta para aderezos',
        imageUrl: 'https://images.unsplash.com/photo-1523626752472-b55a628f1acc?w=500&q=80'
      }
    ];
  }

  // 3. Combo Ensaladas de Huerta Fresca
  if (name.includes('ensalada') || name.includes('huerta fresca') || name.includes('hojas')) {
    return [
      {
        name: 'Espinaca Fresca de Huerta',
        quantity: '2 atados',
        benefit: 'Hojas tiernas para ensaladas crudas o cocidas',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80'
      },
      {
        name: 'Rúcula Silvestre Crocante',
        quantity: '2 atados',
        benefit: 'Hojas con suave picor y textura crujiente',
        imageUrl: 'https://images.unsplash.com/photo-1515589654462-a9881e276b84?w=500&q=80'
      },
      {
        name: 'Lechuga Romana Entera',
        quantity: '1 planta',
        benefit: 'Hojas largas y crujientes de cosecha del día',
        imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&q=80'
      },
      {
        name: 'Tomates Cherry Dulces',
        quantity: '500 g',
        benefit: 'Tomatitos madurados al sol tipo bombón',
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80'
      }
    ];
  }

  // 4. Fallback dinámico
  const desc = combo.description || '';
  const parts = desc.includes(':') ? desc.split(':')[1] : desc;
  const itemsText = parts.split(/,| y /i).map(s => s.trim()).filter(Boolean);

  if (itemsText.length > 0) {
    return itemsText.map(itemStr => {
      const qtyMatch = itemStr.match(/^([\d.,]+\s*(?:kg|g|unid|atado[s]?|planta[s]?))/i);
      const quantity = qtyMatch ? qtyMatch[1] : '1 porción';
      const cleanName = itemStr.replace(/^[\d.,]+\s*(?:kg|g|unid|atado[s]?|planta[s]?)\s*(?:de)?\s*/i, '').trim();

      const matchedProd = allProducts.find(p => 
        p.name.toLowerCase().includes(cleanName.toLowerCase()) || 
        cleanName.toLowerCase().includes(p.name.toLowerCase())
      );

      return {
        name: matchedProd?.name || (cleanName.charAt(0).toUpperCase() + cleanName.slice(1)),
        quantity,
        benefit: 'Seleccionado fresco de huerta',
        imageUrl: matchedProd?.imageUrl || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80'
      };
    });
  }

  return [];
};

export interface ProductDetailModalProps {
  product?: Product | null;
  combo?: Product | null;
  onClose: () => void;
  allProducts?: Product[];
}

export const ProductDetailModal = ({ 
  product, 
  combo, 
  onClose, 
  allProducts = [] 
}: ProductDetailModalProps) => {
  const targetProduct = product || combo;
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Detección de si es combo
  const isCombo = targetProduct ? (
    targetProduct.name.toLowerCase().includes('combo') ||
    targetProduct.name.toLowerCase().includes('bolsón') ||
    targetProduct.name.toLowerCase().includes('bolson') ||
    targetProduct.name.toLowerCase().includes('pack') ||
    Boolean(targetProduct.category?.name?.toLowerCase().includes('combo') ||
    targetProduct.category?.name?.toLowerCase().includes('bolson') ||
    targetProduct.category?.name?.toLowerCase().includes('bolsón'))
  ) : false;

  // Opciones para combos (1, 2, 3, 6)
  const [comboQuantity, setComboQuantity] = useState(1);

  // Opciones para productos regulares (kg o unidad)
  const isKiloProduct = targetProduct ? (targetProduct.unit === 'kg' || !targetProduct.unit) : true;
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

  // Actualizar selectedOption al cambiar de producto
  useEffect(() => {
    setSelectedOption(options[1] || options[0]);
    setComboQuantity(1);
    setIsAdded(false);
  }, [targetProduct?.id]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Bloquear scroll de fondo cuando el modal está abierto
  useEffect(() => {
    if (targetProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [targetProduct]);

  if (!targetProduct) return null;

  // Cálculos de precio
  const unitPrice = Number(targetProduct.price);
  const calculatedPrice = isCombo 
    ? unitPrice * comboQuantity 
    : unitPrice * selectedOption.factor;

  // Manejar añadir al carrito y CERRAR MODAL automáticamente
  const handleAddToCart = () => {
    if (isCombo) {
      addToCart(
        targetProduct,
        comboQuantity,
        `${comboQuantity} ${comboQuantity === 1 ? 'Unidad' : 'Unidades'}`,
        'unit',
        comboQuantity,
        1.0
      );
    } else {
      const isUnit = selectedOption.id === 'unidad' || !isKiloProduct;
      const factor = isKiloProduct ? (selectedOption.id === 'unidad' ? 0.25 : 0.5) : 1.0;
      const count = isKiloProduct 
        ? (selectedOption.id === 'unidad' ? 1 : Math.round(selectedOption.factor / 0.5))
        : Math.round(selectedOption.factor);

      addToCart(
        targetProduct, 
        selectedOption.factor, 
        selectedOption.desc, 
        isUnit ? 'unit' : 'kg',
        count,
        factor
      );
    }

    setIsAdded(true);
    // Cerrar el modal tras una breve confirmación visual
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 400);
  };

  const comboItems = isCombo ? getComboItems(targetProduct, allProducts) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click en backdrop para cerrar */}
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar (X) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          title="Cerrar detalle"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="overflow-y-auto flex-grow">
          {/* Header Visual con Imagen y Badges */}
          <div className="relative h-60 sm:h-72 bg-slate-900 overflow-hidden">
            <img 
              src={targetProduct.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetProduct.name)}&background=16a34a&color=fff&size=512`} 
              alt={targetProduct.name}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(targetProduct.name)}&background=16a34a&color=fff&size=512`;
              }}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {targetProduct.category && (
                  <span className="bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" /> 🌿 {targetProduct.category.name}
                  </span>
                )}
                <span className="bg-amber-400 text-amber-950 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  ☀️ Del Día
                </span>
                {isCombo && (
                  <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    ¡Ahorrá hasta 25%!
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-sm">
                {targetProduct.name}
              </h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Descripción general y atributos de frescura */}
            <div>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                {targetProduct.description || 'Fruto cosechado en su punto óptimo de maduración, fresco y seleccionado especialmente para tu mesa.'}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 mt-4">
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Envíos en el día</p>
                    <p className="text-[10px] text-slate-400">Directo del productor</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">100% Garantizado</p>
                    <p className="text-[10px] text-slate-400">Sin golpes ni mermas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Cosecha de Hoy</p>
                    <p className="text-[10px] text-slate-400">Listo para consumir</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CASO A: DETALLE DE COMBO (PRODUCTOS Y CANTIDADES) */}
            {isCombo && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      Contenido del Combo
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                      {comboItems.length} variedades incluidas
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                    Pesaje y control de calidad previo al envío
                  </span>
                </div>

                {comboItems.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 text-sm">
                    Consultá las variedades disponibles para este bolsón.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {comboItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-slate-50/80 hover:bg-emerald-50/40 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 flex items-center gap-3.5 transition-all group"
                      >
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden bg-white shadow-xs border border-slate-200/70">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=10b981&color=fff&size=256`;
                            }}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-black text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">
                              {item.name}
                            </h4>
                          </div>
                          <span className="inline-block bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg shadow-2xs">
                            {item.quantity}
                          </span>
                          {item.benefit && (
                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-1">
                              {item.benefit}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CASO B: SELECTOR DE FORMATO PARA PRODUCTOS REGULARES */}
            {!isCombo && (
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-700 text-sm font-bold mb-3">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Selecciona el peso o formato deseado:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`py-3 px-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        selectedOption.id === opt.id
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      <span className="text-sm">{opt.label}</span>
                      <span className={`text-[10px] font-medium ${selectedOption.id === opt.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BARRA INFERIOR DE ACCIÓN (STICKY) */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center justify-between w-full sm:w-auto gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isCombo ? 'Precio del combo' : 'Total estimado'}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">${calculatedPrice.toFixed(2)}</span>
                {isCombo && comboQuantity > 1 && (
                  <span className="text-xs font-bold text-slate-400">(${unitPrice.toFixed(2)} c/u)</span>
                )}
                {!isCombo && (
                  <span className="text-xs font-bold text-slate-500">
                    ({selectedOption.desc})
                  </span>
                )}
              </div>
            </div>

            {/* Selector de cantidad para combos */}
            {isCombo && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {[1, 2, 3, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setComboQuantity(num)}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      comboQuantity === num
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {num} {num === 1 ? 'pack' : 'packs'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleAddToCart}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer ${
                isAdded
                  ? 'bg-emerald-500 text-white scale-105 shadow-emerald-500/30'
                  : 'btn-gradient text-white shadow-emerald-500/30 hover:scale-[1.02]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5 animate-in zoom-in" />
                  <span>¡Añadido al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>{isCombo ? 'Añadir Combo al Carrito' : 'Añadir al Carrito'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// Alias export para máxima retrocompatibilidad
export const ComboDetailModal = ProductDetailModal;
