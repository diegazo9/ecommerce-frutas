import { useEffect, useState } from 'react';
import { getShippingZones, createShippingZone, updateShippingZone, deleteShippingZone } from '../services/api';
import type { ShippingZone } from '../services/api';
import { Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminShipping = () => {
  const { token } = useAuth();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, isActive: true });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const data = await getShippingZones();
      setZones(data);
    } catch (err) {
      setError('Error al cargar zonas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id?: number) => {
    if (!token) return;
    try {
      if (id) {
        await updateShippingZone(id, formData, token);
      } else {
        await createShippingZone(formData, token);
      }
      setIsAdding(false);
      setEditingId(null);
      fetchZones();
    } catch (err) {
      setError('Error al guardar zona');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm('¿Estás seguro?')) return;
    try {
      await deleteShippingZone(id, token);
      fetchZones();
    } catch (err) {
      setError('Error al eliminar');
    }
  };

  const startEdit = (zone: ShippingZone) => {
    setEditingId(zone.id);
    setFormData({ name: zone.name, description: zone.description, price: zone.price, isActive: zone.isActive });
  };

  if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800">Zonas de Envío</h2>
        <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', description: '', price: 0, isActive: true }); }} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors">
          <Plus className="w-5 h-5" /> Nueva Zona
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold">{error}</div>}

      <div className="space-y-4">
        {isAdding && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200">
            <h3 className="font-bold text-emerald-800 mb-4">Nueva Zona</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre (ej. CABA)" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Descripción" className="w-full p-2 border rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <input type="number" placeholder="Costo ($)" className="w-full p-2 border rounded-lg" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={() => handleSave()} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {zones.map(zone => (
          <div key={zone.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
            {editingId === zone.id ? (
              <div className="flex-1 mr-6 space-y-3">
                <input type="text" className="w-full p-2 border rounded-lg font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input type="text" className="w-full p-2 border rounded-lg text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <div className="flex gap-4">
                  <input type="number" className="w-32 p-2 border rounded-lg text-sm" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} title="Costo" />
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                    Activo
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex-1 mr-6">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-800">{zone.name}</h3>
                  {!zone.isActive && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Inactivo</span>}
                </div>
                <p className="text-slate-600 text-sm mb-2">{zone.description}</p>
                <span className="text-emerald-700 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                  Costo: ${Number(zone.price).toFixed(2)}
                </span>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {editingId === zone.id ? (
                <>
                  <button onClick={() => handleSave(zone.id)} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100" title="Guardar"><Check className="w-5 h-5" /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200" title="Cancelar"><X className="w-5 h-5" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(zone)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100" title="Editar"><Pencil className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(zone.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100" title="Eliminar"><Trash2 className="w-5 h-5" /></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
