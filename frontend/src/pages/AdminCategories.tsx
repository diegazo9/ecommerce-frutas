import { useState, useEffect } from 'react';
import { getCategories, createCategory, deleteCategory, uploadImage } from '../services/api';
import type { Category } from '../services/api';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X } from 'lucide-react';

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', imageUrl: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Nota: No se puede eliminar si hay productos asociados.')) return;
    try {
      await deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      alert('Error al eliminar (asegúrate de que no tenga productos): ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const newCategory = await createCategory(formData);
      setCategories([...categories, newCategory]);
      setIsModalOpen(false);
      setFormData({ name: '', description: '', imageUrl: '' });
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
          <h1 className="text-3xl font-black text-slate-800">Categorías</h1>
          <p className="text-slate-500 mt-1">Organiza tus productos por familias</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Nueva Categoría
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
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Añadir Nueva Categoría</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Nombre</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" placeholder="Ej. Frutas de Temporada" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Descripción</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Foto de la Categoría</label>
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {formData.imageUrl ? (
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'C')}&background=10b981&color=fff`;
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
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">
                  {isSaving ? 'Guardando...' : 'Guardar Categoría'}
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
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No hay categorías registradas.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{category.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={category.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(category.name)}&background=10b981&color=fff`} 
                          alt={category.name} 
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(category.name)}&background=10b981&color=fff`;
                          }}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100" 
                        />
                        <div>
                          <p className="font-bold text-slate-800">{category.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{category.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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
