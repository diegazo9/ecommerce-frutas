import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, uploadImage } from '../services/api';
import type { Product, Category } from '../services/api';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X } from 'lucide-react';

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '', unit: 'kg', categoryId: '', imageUrl: ''
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
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      imageUrl: ''
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
      imageUrl: product.imageUrl || ''
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

      const payload = {
        ...formData,
        price: cleanPrice,
        stock: cleanStock,
        categoryId: Number(formData.categoryId)
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
      setFormData({ name: '', description: '', price: '', stock: '', unit: 'kg', categoryId: '1', imageUrl: '' });
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Inventario</h1>
          <p className="text-slate-500 mt-1">Gestiona los productos disponibles en la tienda</p>
        </div>
        <button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5" /> <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {editingProductId ? 'Editar Producto' : 'Añadir Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Nombre</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" 
                    placeholder="Ej: Manzana Roja"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Categoría</label>
                  <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white">
                    {categories.length === 0 && <option value="">Sin categorías (Crea una primero)</option>}
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Descripción</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" 
                    placeholder="Breve descripción del producto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Precio ($ ARS)</label>
                  <input 
                    required 
                    type="text"
                    inputMode="decimal"
                    value={formData.price} 
                    onChange={e => {
                      const val = e.target.value.replace(',', '.');
                      setFormData({...formData, price: val});
                    }} 
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-semibold text-slate-800" 
                    placeholder="Ej: 2500"
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
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white">
                      <option value="kg">kg</option>
                      <option value="und">und</option>
                      <option value="gr">gr</option>
                    </select>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">
                  {isSaving ? 'Guardando...' : (editingProductId ? 'Actualizar Producto' : 'Guardar Producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm uppercase tracking-wider">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
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
                      <span className={`font-bold ${Number(product.stock) > 10 ? 'text-slate-700' : 'text-red-500'}`}>
                        {Number(product.stock)} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(product)} 
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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
    </div>
  );
};
