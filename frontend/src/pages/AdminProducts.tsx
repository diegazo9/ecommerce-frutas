import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, uploadImage } from '../services/api';
import type { Product, Category } from '../services/api';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X, Tag, FileSpreadsheet, Calculator } from 'lucide-react';
import { ProductExcelImportModal } from '../components/ProductExcelImportModal';

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    unit: 'kg',
    categoryId: '',
    imageUrl: '',
    price2kg: '',
    discount2kg: '',
    price3kg: '',
    discount3kg: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesData();
  }, []);

  const fetchCategoriesData = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      if (data.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: String(data[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no debe superar los 8 MB.');
      return;
    }

    try {
      setIsUploadingImage(true);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;
      const uploadedUrl = await uploadImage(base64);
      setFormData(prev => ({ ...prev, imageUrl: uploadedUrl }));
    } catch (err: any) {
      console.error('Error subiendo imagen:', err);
      alert('Error subiendo imagen al servidor: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts(true);
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos automáticos bidireccionales de descuentos
  const handleBasePriceChange = (newBasePriceStr: string) => {
    const basePrice = Number(newBasePriceStr.replace(',', '.'));
    setFormData(prev => {
      const next = { ...prev, price: newBasePriceStr };
      if (!isNaN(basePrice) && basePrice > 0) {
        if (prev.discount2kg && Number(prev.discount2kg) > 0) {
          next.price2kg = (basePrice * 2 * (1 - Number(prev.discount2kg) / 100)).toFixed(2);
        }
        if (prev.discount3kg && Number(prev.discount3kg) > 0) {
          next.price3kg = (basePrice * 3 * (1 - Number(prev.discount3kg) / 100)).toFixed(2);
        }
      }
      return next;
    });
  };

  const handleDiscount2kgChange = (percentStr: string) => {
    const percent = Number(percentStr.replace(',', '.'));
    const basePrice = Number(formData.price.replace(',', '.'));
    if (!percentStr || isNaN(percent) || percent <= 0 || isNaN(basePrice) || basePrice <= 0) {
      setFormData(prev => ({ ...prev, discount2kg: percentStr, price2kg: '' }));
    } else {
      const finalPrice = (basePrice * 2 * (1 - percent / 100)).toFixed(2);
      setFormData(prev => ({ ...prev, discount2kg: percentStr, price2kg: finalPrice }));
    }
  };

  const handlePrice2kgChange = (priceStr: string) => {
    const finalPrice = Number(priceStr.replace(',', '.'));
    const basePrice = Number(formData.price.replace(',', '.'));
    if (!priceStr || isNaN(finalPrice) || finalPrice <= 0 || isNaN(basePrice) || basePrice <= 0) {
      setFormData(prev => ({ ...prev, price2kg: priceStr, discount2kg: '' }));
    } else {
      const regular2kg = basePrice * 2;
      const discount = (((regular2kg - finalPrice) / regular2kg) * 100).toFixed(1);
      setFormData(prev => ({ ...prev, price2kg: priceStr, discount2kg: discount }));
    }
  };

  const handleDiscount3kgChange = (percentStr: string) => {
    const percent = Number(percentStr.replace(',', '.'));
    const basePrice = Number(formData.price.replace(',', '.'));
    if (!percentStr || isNaN(percent) || percent <= 0 || isNaN(basePrice) || basePrice <= 0) {
      setFormData(prev => ({ ...prev, discount3kg: percentStr, price3kg: '' }));
    } else {
      const finalPrice = (basePrice * 3 * (1 - percent / 100)).toFixed(2);
      setFormData(prev => ({ ...prev, discount3kg: percentStr, price3kg: finalPrice }));
    }
  };

  const handlePrice3kgChange = (priceStr: string) => {
    const finalPrice = Number(priceStr.replace(',', '.'));
    const basePrice = Number(formData.price.replace(',', '.'));
    if (!priceStr || isNaN(finalPrice) || finalPrice <= 0 || isNaN(basePrice) || basePrice <= 0) {
      setFormData(prev => ({ ...prev, price3kg: priceStr, discount3kg: '' }));
    } else {
      const regular3kg = basePrice * 3;
      const discount = (((regular3kg - finalPrice) / regular3kg) * 100).toFixed(1);
      setFormData(prev => ({ ...prev, price3kg: priceStr, discount3kg: discount }));
    }
  };

  const openCreateModal = () => {
    setEditingProductId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      unit: 'kg',
      categoryId: categories.length > 0 ? String(categories[0].id) : '1',
      imageUrl: '',
      price2kg: '',
      discount2kg: '',
      price3kg: '',
      discount3kg: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      unit: product.unit || 'kg',
      categoryId: String(product.categoryId),
      imageUrl: product.imageUrl || '',
      price2kg: product.price2kg ? String(product.price2kg) : '',
      discount2kg: product.discount2kg ? String(product.discount2kg) : '',
      price3kg: product.price3kg ? String(product.price3kg) : '',
      discount3kg: product.discount3kg ? String(product.discount3kg) : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const cleanPrice = Number(formData.price.replace(',', '.'));
      const cleanStock = Number(formData.stock.replace(',', '.'));

      if (isNaN(cleanPrice) || cleanPrice < 0) {
        alert('Por favor ingresa un precio válido mayor o igual a 0');
        setIsSaving(false);
        return;
      }

      if (isNaN(cleanStock) || cleanStock < 0) {
        alert('Por favor ingresa un stock válido mayor o igual a 0');
        setIsSaving(false);
        return;
      }

      const cleanPrice2kg = formData.price2kg ? Number(formData.price2kg.replace(',', '.')) : null;
      const cleanDiscount2kg = formData.discount2kg ? Number(formData.discount2kg.replace(',', '.')) : null;
      const cleanPrice3kg = formData.price3kg ? Number(formData.price3kg.replace(',', '.')) : null;
      const cleanDiscount3kg = formData.discount3kg ? Number(formData.discount3kg.replace(',', '.')) : null;

      const payload = {
        name: formData.name,
        description: formData.description,
        price: cleanPrice,
        stock: cleanStock,
        unit: formData.unit,
        categoryId: Number(formData.categoryId),
        imageUrl: formData.imageUrl,
        price2kg: cleanPrice2kg,
        discount2kg: cleanDiscount2kg,
        price3kg: cleanPrice3kg,
        discount3kg: cleanDiscount3kg
      };

      const selectedCatObj = categories.find(c => c.id === Number(formData.categoryId));

      if (editingProductId) {
        const updated = await updateProduct(editingProductId, payload);
        const productWithCategory = {
          ...updated,
          category: updated.category || selectedCatObj
        };
        setProducts(products.map(p => p.id === editingProductId ? productWithCategory : p));
      } else {
        const newProduct = await createProduct(payload);
        const productWithCategory = {
          ...newProduct,
          category: newProduct.category || selectedCatObj
        };
        setProducts([...products, productWithCategory]);
      }

      setIsModalOpen(false);
      setEditingProductId(null);
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        stock: '', 
        unit: 'kg', 
        categoryId: '1', 
        imageUrl: '',
        price2kg: '',
        discount2kg: '',
        price3kg: '',
        discount3kg: ''
      });
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Catálogo de Productos y Combos</h2>
          <p className="text-slate-500 mt-1">Administra tus frutas, verduras, combos y descuentos por volumen.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            to="/admin/pricing-calculator"
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-4 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer text-sm"
            title="Calcular costos de compra, mermas de descarte y márgenes de ganancia"
          >
            <Calculator className="w-5 h-5 text-amber-600" />
            <span>Precios & Mermas</span>
          </Link>
          <button 
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer text-sm"
            title="Importar catálogo o actualizar stock masivamente desde Excel o CSV"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Cargar con Excel</span>
          </button>
          <button 
            type="button"
            onClick={openCreateModal}
            className="btn-gradient text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform cursor-pointer text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">
                {editingProductId ? 'Editar Producto / Combo' : 'Nuevo Producto / Combo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Nombre</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" 
                    placeholder="Ej: Manzana Roja o Bolsón Familiar (8 kg)" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Descripción</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none h-20" 
                    placeholder="Detalles del producto o contenido del combo..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Categoría</label>
                  <select 
                    value={formData.categoryId} 
                    onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Precio Base ($)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="any"
                    value={formData.price} 
                    onChange={e => handleBasePriceChange(e.target.value)} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-800" 
                    placeholder="Ej: 1000"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-600 mb-1">Stock</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      step="any"
                      value={formData.stock} 
                      onChange={e => setFormData({...formData, stock: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-semibold text-slate-800" 
                      placeholder="Ej: 50"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-bold text-slate-600 mb-1">Unidad</label>
                    <select 
                      value={formData.unit} 
                      onChange={e => setFormData({...formData, unit: e.target.value})} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium"
                    >
                      <option value="kg">kg</option>
                      <option value="und">und</option>
                      <option value="gr">gr</option>
                    </select>
                  </div>
                </div>

                {/* SECCIÓN NUEVA: DESCUENTOS POR VOLUMEN (2 KG Y 3 KG O UNIDADES) */}
                <div className="col-span-2 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Descuentos por Cantidad / Volumen (2 y 3 {formData.unit === 'und' ? 'unidades' : 'kilos'})</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Configura el descuento para compras de 2 y 3 {formData.unit === 'und' ? 'unidades' : 'kg'}. Puedes ingresar el <strong>% de descuento</strong> o el <strong>precio final promocional</strong> (ambos campos se calculan automáticamente).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Descuento 2 kg / 2 Unidades */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">
                          Para 2 {formData.unit === 'und' ? 'unidades' : 'kg'}
                        </span>
                        {formData.discount2kg && Number(formData.discount2kg) > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            🔥 {formData.discount2kg}% OFF
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">% Descuento</label>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              max="99"
                              step="any"
                              placeholder="Ej: 10"
                              value={formData.discount2kg}
                              onChange={e => handleDiscount2kgChange(e.target.value)}
                              className="w-full p-2 pr-6 text-xs rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-bold"
                            />
                            <span className="absolute right-2 top-2 text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Precio Final ($)</label>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-xs text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Ej: 1800"
                              value={formData.price2kg}
                              onChange={e => handlePrice2kgChange(e.target.value)}
                              className="w-full p-2 pl-5 text-xs rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-bold text-emerald-700"
                            />
                          </div>
                        </div>
                      </div>
                      {formData.price && Number(formData.price) > 0 && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Sin descuento: ${(Number(formData.price) * 2).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Descuento 3 kg / 3 Unidades */}
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">
                          Para 3 {formData.unit === 'und' ? 'unidades' : 'kg'}
                        </span>
                        {formData.discount3kg && Number(formData.discount3kg) > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            🔥 {formData.discount3kg}% OFF
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">% Descuento</label>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              max="99"
                              step="any"
                              placeholder="Ej: 15"
                              value={formData.discount3kg}
                              onChange={e => handleDiscount3kgChange(e.target.value)}
                              className="w-full p-2 pr-6 text-xs rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-bold"
                            />
                            <span className="absolute right-2 top-2 text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Precio Final ($)</label>
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-xs text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Ej: 2550"
                              value={formData.price3kg}
                              onChange={e => handlePrice3kgChange(e.target.value)}
                              className="w-full p-2 pl-5 text-xs rounded-lg border border-slate-200 outline-none focus:border-emerald-500 font-bold text-emerald-700"
                            />
                          </div>
                        </div>
                      </div>
                      {formData.price && Number(formData.price) > 0 && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Sin descuento: ${(Number(formData.price) * 3).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Foto del Producto</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {formData.imageUrl ? (
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'P')}&background=10b981&color=fff`;
                        }}
                        className="w-16 h-16 rounded-xl object-cover shadow-sm bg-white" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                        <Plus className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="w-full p-2 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50" 
                      />
                      {isUploadingImage && <p className="text-xs text-emerald-600 mt-1 font-bold animate-pulse">Subiendo imagen al servidor...</p>}
                    </div>
                  </div>
                  <input 
                    type="url" 
                    value={formData.imageUrl} 
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                    className="w-full mt-2 p-2 text-xs rounded-lg border border-slate-200 outline-none text-slate-600 focus:border-emerald-500" 
                    placeholder="URL de la imagen (se completa al subir archivo o pega un link aquí)" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 cursor-pointer">
                  {isSaving ? 'Guardando...' : (editingProductId ? 'Actualizar Producto' : 'Guardar Producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Productos con Indicadores de Descuento */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio Base</th>
                <th className="px-6 py-4">Descuento Volumen</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=10b981&color=fff`} 
                          alt={product.name} 
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=10b981&color=fff`;
                          }}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100" 
                        />
                        <div>
                          <p className="font-bold text-slate-800">{product.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-100">
                        {categories.find(c => c.id === product.categoryId)?.name || product.category?.name || `Cat: ${product.categoryId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-700">${Number(product.price).toFixed(2)}</span>
                      <span className="text-xs text-slate-400 font-medium ml-1">/{product.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      {Boolean(product.discount2kg || product.price2kg || product.discount3kg || product.price3kg) ? (
                        <div className="flex flex-col gap-1">
                          {Boolean(product.discount2kg || product.price2kg) && (
                            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 inline-flex items-center gap-1 w-fit">
                              🔥 2{product.unit}: {product.discount2kg ? `-${product.discount2kg}%` : ''} (${Number(product.price2kg || 0).toFixed(0)})
                            </span>
                          )}
                          {Boolean(product.discount3kg || product.price3kg) && (
                            <span className="text-[11px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/60 inline-flex items-center gap-1 w-fit">
                              🔥 3{product.unit}: {product.discount3kg ? `-${product.discount3kg}%` : ''} (${Number(product.price3kg || 0).toFixed(0)})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin descuento</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {Number(product.stock) <= 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 font-black text-xs rounded-lg border border-red-200">
                          ⚠️ Sin Stock (Oculto en web)
                        </span>
                      ) : (
                        <span className={`font-bold ${Number(product.stock) > 10 ? 'text-slate-700' : 'text-amber-600'}`}>
                          {Number(product.stock)} {product.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/pricing-calculator?productId=${product.id}`}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" 
                          title="Calcular costos, merma y precio de este producto"
                        >
                          <Calculator className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleEdit(product)} 
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" 
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Carga Masiva Excel */}
      <ProductExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          fetchProducts();
          fetchCategoriesData();
        }}
        existingProducts={products}
        categories={categories}
      />
    </div>
  );
};
