import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RouteStop, Coordinates } from '../utils/geocoding';
import { Check, ExternalLink, MapPin } from 'lucide-react';

interface DeliveryRouteMapProps {
  depotCoords: Coordinates;
  depotName: string;
  stops: RouteStop[];
  selectedStopId?: number | null;
  onSelectStop?: (stop: RouteStop) => void;
  onMarkDelivered?: (orderId: number) => void;
}

// Componente para ajustar la vista del mapa automáticamente para encuadrar todas las paradas
const FitBoundsHandler = ({ points }: { points: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, points]);

  return null;
};

// Generador de íconos personalizados Leaflet HTML
const createNumberedIcon = (number: number, status: string, isSelected: boolean) => {
  const isDelivered = status === 'ENTREGADO';
  const isEnCamino = status === 'EN_CAMINO';
  
  let bgColor = 'bg-amber-500';
  let borderColor = 'border-amber-600';
  let ringColor = 'ring-amber-200';

  if (isDelivered) {
    bgColor = 'bg-emerald-600';
    borderColor = 'border-emerald-700';
    ringColor = 'ring-emerald-200';
  } else if (isEnCamino) {
    bgColor = 'bg-blue-600';
    borderColor = 'border-blue-700';
    ringColor = 'ring-blue-200';
  }

  const selectedClass = isSelected ? 'scale-125 z-50 ring-4' : 'scale-100 hover:scale-110';

  return L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div class="relative flex items-center justify-center transition-transform ${selectedClass}">
        <div class="w-8 h-8 rounded-full ${bgColor} border-2 ${borderColor} ${ringColor} text-white font-black text-xs flex items-center justify-center shadow-lg">
          ${isDelivered ? '✓' : number}
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-${isDelivered ? 'emerald-700' : isEnCamino ? 'blue-700' : 'amber-600'}"></div>
      </div>
    `,
    iconSize: [32, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36]
  });
};

const createDepotIcon = () => {
  return L.divIcon({
    className: 'custom-depot-marker',
    html: `
      <div class="relative flex items-center justify-center hover:scale-110 transition-transform">
        <div class="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-emerald-400 text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-400/30">
          <span class="text-base">🏪</span>
        </div>
        <div class="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
      </div>
    `,
    iconSize: [40, 44],
    iconAnchor: [20, 44],
    popupAnchor: [0, -44]
  });
};

export const DeliveryRouteMap = ({
  depotCoords,
  depotName,
  stops,
  selectedStopId,
  onSelectStop,
  onMarkDelivered
}: DeliveryRouteMapProps) => {

  // Puntos para la polilínea de la ruta (Depósito -> Parada 1 -> Parada 2 ...)
  const polylinePositions = useMemo<[number, number][]>(() => {
    return [
      [depotCoords.lat, depotCoords.lng],
      ...stops.map(s => [s.coordinates.lat, s.coordinates.lng] as [number, number])
    ];
  }, [depotCoords, stops]);

  const allPoints = useMemo<[number, number][]>(() => {
    return polylinePositions;
  }, [polylinePositions]);

  return (
    <div className="relative h-[480px] sm:h-[540px] w-full rounded-3xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-100 z-0">
      <MapContainer
        center={[depotCoords.lat, depotCoords.lng]}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBoundsHandler points={allPoints} />

        {/* Polilínea trazada de la ruta */}
        {polylinePositions.length > 1 && (
          <>
            {/* Sombra de la ruta */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#0f172a',
                weight: 6,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Línea principal vibrante */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                opacity: 0.9,
                dashArray: '6, 8',
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Marcador del Depósito / Salida */}
        <Marker
          position={[depotCoords.lat, depotCoords.lng]}
          icon={createDepotIcon()}
        >
          <Popup>
            <div className="p-1 max-w-[220px]">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                <span>🏪</span> {depotName}
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Punto de partida y retorno del reparto
              </p>
              <div className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded-lg border border-emerald-200">
                🚀 Inicio de la Hoja de Ruta
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores numerados para cada parada */}
        {stops.map((stop, index) => {
          const stopNumber = index + 1;
          const isSelected = selectedStopId === stop.id;
          const isDelivered = stop.status === 'ENTREGADO';

          return (
            <Marker
              key={stop.id}
              position={[stop.coordinates.lat, stop.coordinates.lng]}
              icon={createNumberedIcon(stopNumber, stop.status, isSelected)}
              eventHandlers={{
                click: () => onSelectStop && onSelectStop(stop)
              }}
            >
              <Popup>
                <div className="p-1 min-w-[220px] max-w-[280px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1.5">
                    <span className="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                      Parada #{stopNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Pedido #{stop.orderId}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-sm mb-0.5">
                    {stop.customerName}
                  </h4>

                  <p className="text-xs text-slate-600 flex items-start gap-1 mb-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{stop.address}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 mb-2.5 text-[11px]">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Horario</span>
                      <span className="font-bold text-slate-700">{stop.timeRange || 'Sin franja'}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Total</span>
                      <span className="font-black text-emerald-700">${stop.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {stop.isApproximate && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded mb-2 border border-amber-200/60">
                      ⚠️ Ubicación aproximada por zona ({stop.zoneName})
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.address}, ${stop.zoneName}, Argentina`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>GPS</span>
                    </a>

                    {!isDelivered && onMarkDelivered && (
                      <button
                        type="button"
                        onClick={() => onMarkDelivered(stop.orderId)}
                        className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Entregado</span>
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Leyenda flotante en la esquina inferior */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200/80 text-[11px] font-bold text-slate-700 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-900 border border-emerald-400"></span>
          <span>Depósito / Inicio</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Pendiente de Entrega</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          <span>En Camino</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
          <span>Entregado</span>
        </div>
      </div>
    </div>
  );
};
