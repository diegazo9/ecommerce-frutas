import { useState, useEffect } from 'react';
import { 
  Calculator, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Save, 
  Package, 
  Truck, 
  RefreshCw, 
  Info, 
  Layers, 
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { getProducts, updateProduct, type Product } from '../services/api';
import { useSearchParams } from 'react-router-dom';

interface WastePreset {
  name: string;
  categoryName: string;
  percentage: number;
  description: string;
}

const WASTE_PRESETS: WastePreset[] = [
  { name: 'Verduras de Hoja', categoryName: 'Lechuga, Acelga, Espinaca, Rúcula', percentage: 28, description: 'Descarte por hojas exteriores marchitas, tallos duros y humedad.' },
  { name: 'Tomates y Hortalizas Fruto', categoryName: 'Tomate, Berenjena, Zapallito, Pepino', percentage: 12, description: 'Descarte por sobremaduración y magulladuras por presión.' },
  { name: 'Tubérculos y Raíces', categoryName: 'Papa, Cebolla, Zanahoria, Batata', percentage: 7, description: 'Descarte por tierra adherida, brotes, cáscara y unidades dañadas.' },
  { name: 'Cítricos', categoryName: 'Naranja, Mandarina, Limón, Pomelo', percentage: 6, description: 'Descarte leve por piel deshidratada o fruta blanda.' },
  { name: 'Frutas Pomáceas y Carozo', categoryName: 'Manzana, Pera, Durazno, Ciruela', percentage: 8, description: 'Descarte por marcas de roce, golpes de cajón y calibre chico.' },
  { name: 'Frutas Delicadas', categoryName: 'Frutilla, Arándanos, Frambuesa', percentage: 18, description: 'Alta merma por aplastamiento y moho rápido en bandejas.' },
  { name: 'Tropicales y Cremosas', categoryName: 'Banana, Palta Hass, Mango', percentage: 12, description: 'Desgrane de pencas de banana y sobremaduración rápida.' },
];

export const AdminPricingCalculator = () => {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('productId');

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(preSelectedId || '');
  const [loading, setLoading] = useState<boolean>(true);

  // Formulario de Costos y Bulto
  const [productName, setProductName] = useState<string>('');
  const [packageType, setPackageType] = useState<string>('cajon'); // cajon, bolsa, jaula, jaulin, kilo
  const [packageCost, setPackageCost] = useState<number>(20000); // Costo del bulto en $
  const [grossWeight, setGrossWeight] = useState<number>(20); // Peso bruto en kg
  const [freightCost, setFreightCost] = useState<number>(1500); // Flete prorrateado por bulto en $
  const [packagingExtra, setPackagingExtra] = useState<number>(500); // Bolsas / insumos en $

  // Merma
  const [wastePercentage, setWastePercentage] = useState<number>(12); // % de merma
  const [wasteMode, setWasteMode] = useState<'preset' | 'weighing'>('preset');
  const [sampleGross, setSampleGross] = useState<number>(20);
  const [sampleDiscard, setSampleDiscard] = useState<number>(2.4);

  // Margen y Precios
  const [marginPercentage, setMarginPercentage] = useState<number>(45); // % de ganancia
  const [pricingMethod, setPricingMethod] = useState<'markup' | 'margin'>('markup'); // Markup o Margen sobre venta
  const [roundingOption, setRoundingOption] = useState<number>(50); // Redondear a $50 o $100

  // Descuentos para 2kg y 3kg
  const [discount2kgPercent, setDiscount2kgPercent] = useState<number>(10);
  const [discount3kgPercent, setDiscount3kgPercent] = useState<number>(15);

  // Estados de guardado
  const [isUpdatingStore, setIsUpdatingStore] = useState<boolean>(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const data = await getProducts(true);
      setProducts(data);

      if (preSelectedId) {
        const found = data.find(p => String(p.id) === preSelectedId);
        if (found) {
          selectProduct(found);
        }
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (p: Product) => {
    setSelectedProductId(String(p.id));
    setProductName(p.name);
    // Intentar adivinar preset según categoría o nombre
    const lower = (p.name + ' ' + (p.category?.name || '')).toLowerCase();
    const matchedPreset = WASTE_PRESETS.find(preset => 
      lower.includes(preset.name.toLowerCase()) || 
      preset.categoryName.toLowerCase().split(', ').some(k => lower.includes(k.trim()))
    );
    if (matchedPreset) {
      setWastePercentage(matchedPreset.percentage);
    }

    if (p.discount2kg) setDiscount2kgPercent(Number(p.discount2kg));
    if (p.discount3kg) setDiscount3kgPercent(Number(p.discount3kg));
  };

  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val);
    if (!val) {
      setProductName('');
      return;
    }
    const found = products.find(p => String(p.id) === val);
    if (found) {
      selectProduct(found);
    }
  };

  // Cálculos matemáticos de Merma y Costos
  const effectiveWaste = wasteMode === 'weighing'
    ? (sampleGross > 0 ? (sampleDiscard / sampleGross) * 100 : 0)
    : wastePercentage;

  const totalPackageInvestment = (Number(packageCost) || 0) + (Number(freightCost) || 0) + (Number(packagingExtra) || 0);
  const grossCostPerKg = grossWeight > 0 ? totalPackageInvestment / grossWeight : 0;
  
  const wasteKg = (grossWeight * (effectiveWaste / 100));
  const netSellableKg = Math.max(0.1, grossWeight - wasteKg);
  const wasteLostValue = wasteKg * grossCostPerKg;

  // Costo Real por Kilo Vendible (¡absorbiendo la merma!)
  const realCostPerKg = netSellableKg > 0 ? totalPackageInvestment / netSellableKg : 0;

  // Cálculo de Precio de Venta Base (1 kg)
  let rawSalePrice = 0;
  if (pricingMethod === 'markup') {
    rawSalePrice = realCostPerKg * (1 + (marginPercentage / 100));
  } else {
    // Margen sobre venta: Costo / (1 - Margen)
    const marginRatio = 1 - (marginPercentage / 100);
    rawSalePrice = marginRatio > 0 ? realCostPerKg / marginRatio : realCostPerKg;
  }

  // Redondeo comercial
  const roundPrice = (val: number, step: number) => {
    if (step <= 0) return Math.round(val);
    return Math.round(val / step) * step;
  };

  const finalSalePrice1kg = roundPrice(rawSalePrice, roundingOption);

  // Precios Promocionales de 2 kg y 3 kg
  const rawPrice2kg = finalSalePrice1kg * 2 * (1 - (discount2kgPercent / 100));
  const finalPrice2kg = roundPrice(rawPrice2kg, roundingOption);

  const rawPrice3kg = finalSalePrice1kg * 3 * (1 - (discount3kgPercent / 100));
  const finalPrice3kg = roundPrice(rawPrice3kg, roundingOption);

  // Ganancias Proyectadas por Bulto
  const projectedRevenue = netSellableKg * finalSalePrice1kg;
  const netProfit = projectedRevenue - totalPackageInvestment;
  const profitMarginActual = projectedRevenue > 0 ? (netProfit / projectedRevenue) * 100 : 0;
  const roiActual = totalPackageInvestment > 0 ? (netProfit / totalPackageInvestment) * 100 : 0;

  // Guardar directo en producto existente
  const handleApplyToStore = async () => {
    if (!selectedProductId) {
      alert('Selecciona un producto del catálogo para actualizar sus precios.');
      return;
    }

    try {
      setIsUpdatingStore(true);
      setUpdateSuccessMessage(null);

      await updateProduct(Number(selectedProductId), {
        price: finalSalePrice1kg,
        price2kg: finalPrice2kg,
        discount2kg: discount2kgPercent,
        price3kg: finalPrice3kg,
        discount3kg: discount3kgPercent
      });

      setUpdateSuccessMessage(`¡Precios de "${productName || 'Producto'}" actualizados en la tienda online con éxito!`);
      fetchCatalog();
      setTimeout(() => setUpdateSuccessMessage(null), 6000);
    } catch (err: any) {
      alert('Error al actualizar el producto: ' + err.message);
    } finally {
      setIsUpdatingStore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            <Calculator className="w-3.5 h-3.5" /> Rentabilidad & Mermas
          </div>
          <h2 className="text-3xl font-black text-slate-800">
            Calculadora de Precios y Mermas
          </h2>
          <p className="text-slate-500 mt-1">
            Calcula el costo real de tus frutas y verduras considerando el descarte, flete y margen de ganancia.
          </p>
        </div>

        {selectedProductId && (
          <button
            type="button"
            onClick={handleApplyToStore}
            disabled={isUpdatingStore}
            className="btn-gradient text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            {isUpdatingStore ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>Aplicar Precios a la Tienda</span>
          </button>
        )}
      </div>

      {updateSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-in zoom-in-95">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <span className="font-bold text-sm">{updateSuccessMessage}</span>
        </div>
      )}

      {/* Grid Principal: Formulario a la izquierda, Resultados en vivo a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: Entradas de Costo, Bulto y Merma (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Tarjeta 1: Producto */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-100 pb-3">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>1. Producto a Calcular</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Vincular con Producto de la Tienda
                </label>
                <select
                  value={selectedProductId}
                  onChange={handleProductSelectChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="">(Cálculo libre / Nuevo producto)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Actual: ${Number(p.price).toLocaleString('es-AR')}/{p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nombre de Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tomate Perita, Acelga, etc."
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Costo de Compra y Empaque */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-100 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>2. Compra en el Mercado / Proveedor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tipo de Bulto
                </label>
                <select
                  value={packageType}
                  onChange={e => setPackageType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="cajon">Cajón</option>
                  <option value="bolsa">Bolsa</option>
                  <option value="jaula">Jaula</option>
                  <option value="torito">Torito / Jaulín</option>
                  <option value="bandeja">Bandeja / Pack</option>
                  <option value="kilo">Kilos Sueltos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Costo de Compra del Bulto ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={packageCost}
                    onChange={e => setPackageCost(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Peso Bruto del Bulto (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={grossWeight}
                    onChange={e => setGrossWeight(Number(e.target.value))}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">kg</span>
                </div>
              </div>
            </div>

            {/* Gastos adicionales de Flete y Empaque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Flete & Descarga por Bulto ($)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={freightCost}
                    onChange={e => setFreightCost(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Costo de traer el cajón del mercado central.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bolsas / Insumos por Bulto ($)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={packagingExtra}
                    onChange={e => setPackagingExtra(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Bolsas plásticas, etiquetas, cinta.</span>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Cálculo y Presets de Merma */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <Scale className="w-5 h-5 text-amber-500" />
                <span>3. Merma y Desperdicio Inevitable</span>
              </div>

              {/* Selector de Modo Preset o Pesaje Real */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setWasteMode('preset')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    wasteMode === 'preset' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tablas Típicas
                </button>
                <button
                  type="button"
                  onClick={() => setWasteMode('weighing')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    wasteMode === 'weighing' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pesaje en Balanza
                </button>
              </div>
            </div>

            {wasteMode === 'preset' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Selecciona la categoría para aplicar el porcentaje de merma promedio habitual en verdulerías:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WASTE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setWastePercentage(preset.percentage)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        wastePercentage === preset.percentage
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-800">{preset.name}</span>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {preset.percentage}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.categoryName}</p>
                    </button>
                  ))}
                </div>

                {/* Slider manual */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-700">Ajuste Fino de Merma Manual:</span>
                    <span className="text-sm font-black text-amber-600">{wastePercentage}% de descarte</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    step="1"
                    value={wastePercentage}
                    onChange={e => setWastePercentage(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              /* Modo Pesaje en Balanza */
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Calcula pesando una muestra en tu balanza:</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Peso Bruto Inicial (kg)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={sampleGross}
                      onChange={e => setSampleGross(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kilos Descartados / Basura (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={sampleDiscard}
                      onChange={e => setSampleDiscard(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>
                <div className="text-right text-xs font-bold text-slate-700">
                  Merma resultante: <span className="text-amber-600 text-sm font-black">{effectiveWaste.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta 4: Margen de Ganancia y Promociones 2kg/3kg */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>4. Margen de Ganancia y Promociones</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPricingMethod('markup')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    pricingMethod === 'markup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Porcentaje sobre el costo real"
                >
                  Markup (+%)
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMethod('margin')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    pricingMethod === 'margin' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Margen neto sobre precio de venta"
                >
                  Margen Bruto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Margen Deseado (%)
                </label>
                <div className="flex items-center gap-2">
                  {[35, 40, 45, 50, 60].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarginPercentage(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        marginPercentage === m
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
                <div className="mt-2 relative">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={marginPercentage}
                    onChange={e => setMarginPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Redondeo Comercial
                </label>
                <select
                  value={roundingOption}
                  onChange={e => setRoundingOption(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value={10}>Redondear a $10</option>
                  <option value={50}>Redondear a $50 (Sugerido)</option>
                  <option value={100}>Redondear a $100</option>
                  <option value={0}>Sin redondeo (Centavos exactos)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Facilita el vuelto y cobro en efectivo / web.</span>
              </div>
            </div>

            {/* Configuración de Promos por volumen */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  % Descuento Promo 2 kg
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={discount2kgPercent}
                    onChange={e => setDiscount2kgPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  % Descuento Promo 3 kg
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={discount3kgPercent}
                    onChange={e => setDiscount3kgPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>

          </div>

        </div>


        {/* COLUMNA DERECHA: Resultados en Vivo, Diagnóstico de Merma y Ganancia (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Tarjeta Destacada de Precios Sugeridos */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold block">
                  Precio de Venta Sugerido
                </span>
                <span className="text-xs text-slate-400 font-medium">Para tienda web y mostrador</span>
              </div>
              <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black border border-emerald-500/30">
                +{marginPercentage}% Ganancia
              </div>
            </div>

            {/* PRECIO 1 KG */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 block">1 Kilo (Precio Base)</span>
                <span className="text-xs text-emerald-400">Margen neto ${(finalSalePrice1kg - realCostPerKg).toFixed(0)}/kg</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-400">
                  ${finalSalePrice1kg.toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-400 block">por kg</span>
              </div>
            </div>

            {/* PROMO 2 KG y PROMO 3 KG */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-300">Llevando 2 kg</span>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded">
                    -{discount2kgPercent}%
                  </span>
                </div>
                <span className="text-xl font-black text-white block">
                  ${finalPrice2kg.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  (${(finalPrice2kg / 2).toFixed(0)}/kg)
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-300">Llevando 3 kg</span>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded">
                    -{discount3kgPercent}%
                  </span>
                </div>
                <span className="text-xl font-black text-white block">
                  ${finalPrice3kg.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  (${(finalPrice3kg / 3).toFixed(0)}/kg)
                </span>
              </div>
            </div>

            {/* BOTÓN APLICAR SI HAY PRODUCTO */}
            {selectedProductId ? (
              <button
                type="button"
                onClick={handleApplyToStore}
                disabled={isUpdatingStore}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUpdatingStore ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>Aplicar a "{productName || 'Producto'}" en la Tienda</span>
              </button>
            ) : (
              <p className="text-xs text-center text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                💡 Para sincronizar estos precios directamente en la web, selecciona un producto arriba en el paso 1.
              </p>
            )}

          </div>

          {/* Tarjeta de Diagnóstico de Merma y Costos Reales */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Desglose de Costos & Merma</span>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Inversión Total en el Bulto (Compra + Flete):</span>
                <span className="font-bold text-slate-800">${totalPackageInvestment.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Costo Aparente (Bruto sin merma):</span>
                <span className="font-semibold text-slate-500">${grossCostPerKg.toFixed(2)} / kg</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-50 bg-amber-50/60 p-2 rounded-xl text-amber-900">
                <div>
                  <span className="font-bold block">Pérdida por Merma ({effectiveWaste}%):</span>
                  <span className="text-[10px] text-amber-700">Equivale a {wasteKg.toFixed(2)} kg descartados</span>
                </div>
                <span className="font-black text-amber-700">-${wasteLostValue.toFixed(0)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">Kilos Netos que Realmente Vendes:</span>
                <span className="font-black text-emerald-700 text-sm">{netSellableKg.toFixed(2)} kg</span>
              </div>

              <div className="flex justify-between items-center py-2 bg-emerald-50/70 p-3 rounded-xl text-emerald-950 border border-emerald-100">
                <div>
                  <span className="font-extrabold text-xs block">Costo Real por Kilo Vendible:</span>
                  <span className="text-[10px] text-emerald-700">
                    (Debe cubrir la compra completa + flete)
                  </span>
                </div>
                <span className="font-black text-base text-emerald-700">
                  ${realCostPerKg.toFixed(2)}
                </span>
              </div>

            </div>
          </div>

          {/* Tarjeta de Ganancia Proyectada por Bulto */}
          <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-lg space-y-4">
            <span className="text-xs uppercase font-black tracking-wider text-emerald-200 block">
              Ganancia Proyectada por {packageType.toUpperCase()}
            </span>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-xs text-emerald-100 block">Facturación Total:</span>
                <span className="text-lg font-black">${projectedRevenue.toFixed(0)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-100 block">Ganancia Neta en Bolsillo:</span>
                <span className="text-2xl font-black text-yellow-300">
                  ${netProfit.toFixed(0)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500 flex justify-between items-center text-xs text-emerald-100">
              <span>Margen sobre venta: <strong>{profitMarginActual.toFixed(1)}%</strong></span>
              <span>Retorno sobre inversión: <strong>+{roiActual.toFixed(0)}% ROI</strong></span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
