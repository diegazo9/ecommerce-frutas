import { useEffect, useState } from 'react';
import { getShippingZones } from '../services/api';
import type { ShippingZone } from '../services/api';
import { Loader2, MapPin } from 'lucide-react';
import { ShippingMap } from '../components/ShippingMap';

export const Shipping = () => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShippingZones().then(data => setZones(data.filter(z => z.isActive))).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-800 mb-4 flex justify-center items-center gap-3">
          <MapPin className="w-10 h-10 text-emerald-500" />
          Envíos y Zonas
        </h1>
        <p className="text-slate-600 text-lg">Actualmente realizamos entregas en las siguientes zonas de CABA y GBA.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna Izquierda: Mapa */}
        <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <ShippingMap zones={zones} />
          <p className="text-xs text-center text-slate-400 mt-2 p-2">El mapa muestra zonas de cobertura aproximadas.</p>
        </div>

        {/* Columna Derecha: Lista de Zonas */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Detalle de Cobertura</h2>
          
          <div className="space-y-4 text-slate-600">
            {zones.map((zone, idx) => (
              <div key={zone.id} className={`p-5 border rounded-2xl transition-all hover:-translate-y-1 ${idx === 0 ? 'border-emerald-200 bg-emerald-50 shadow-sm shadow-emerald-100' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-xl ${idx === 0 ? 'text-emerald-800' : 'text-slate-800'}`}>{zone.name}</h3>
                  <span className={`font-black text-sm px-3 py-1 rounded-full ${idx === 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-700'}`}>
                    ${Number(zone.price).toFixed(2)}
                  </span>
                </div>
                <p className="text-slate-600">{zone.description}</p>
              </div>
            ))}
            {zones.length === 0 && <p className="text-slate-500 italic">No hay zonas de envío configuradas en este momento.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};
