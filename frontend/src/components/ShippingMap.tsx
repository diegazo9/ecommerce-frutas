import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import type { ShippingZone } from '../services/api';

interface ShippingMapProps {
  zones: ShippingZone[];
}

export const ShippingMap = ({ zones }: ShippingMapProps) => {
  // Centro de Buenos Aires
  const center: [number, number] = [-34.6037, -58.3816];

  // Coordenadas aproximadas para dibujar los círculos de las zonas
  const zoneCoordinates: Record<string, { lat: number, lng: number, radius: number, color: string }> = {
    'CABA': { lat: -34.6037, lng: -58.4516, radius: 8000, color: '#10b981' }, // Verde
    'GBA Norte': { lat: -34.4925, lng: -58.5306, radius: 10000, color: '#3b82f6' }, // Azul
    'GBA Sur': { lat: -34.7293, lng: -58.3242, radius: 12000, color: '#f59e0b' }, // Naranja
  };

  const getCoordinatesForZone = (zoneName: string) => {
    if (zoneName.toUpperCase().includes('CABA')) return zoneCoordinates['CABA'];
    if (zoneName.toUpperCase().includes('NORTE')) return zoneCoordinates['GBA Norte'];
    if (zoneName.toUpperCase().includes('SUR')) return zoneCoordinates['GBA Sur'];
    return null;
  };

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <MapContainer center={center} zoom={10} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {zones.map(zone => {
          const coords = getCoordinatesForZone(zone.name);
          if (!coords) return null;

          return (
            <Circle 
              key={zone.id}
              center={[coords.lat, coords.lng]} 
              radius={coords.radius}
              pathOptions={{ fillColor: coords.color, color: coords.color, fillOpacity: 0.2 }}
            >
              <Popup>
                <div className="font-sans">
                  <h3 className="font-bold text-lg">{zone.name}</h3>
                  <p className="text-sm mt-1 mb-2">{zone.description}</p>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded text-xs">
                    Costo: ${Number(zone.price).toFixed(2)}
                  </span>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
};
