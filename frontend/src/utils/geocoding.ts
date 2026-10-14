// Utilidad de geocodificación, cálculo de distancias y optimización de rutas

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteStop {
  id: number;
  orderId: number;
  customerName: string;
  customerEmail: string;
  address: string;
  zoneName: string;
  timeRange: string;
  deliveryDate?: string;
  total: number;
  status: string;
  paymentMethod?: string;
  coordinates: Coordinates;
  isApproximate?: boolean;
  notes?: string;
}

// Punto de partida predeterminado (Depósito central de Vibranfrut)
export const DEFAULT_DEPOT: { name: string; address: string; coordinates: Coordinates } = {
  name: 'Depósito Central Vibranfrut',
  address: 'Av. Corrientes y Av. 9 de Julio, CABA',
  coordinates: { lat: -34.6037, lng: -58.3816 }
};

// Coordenadas conocidas de zonas y barrios para resolución rápida sin esperar APIs externas
const ZONE_CENTROIDS: Record<string, Coordinates> = {
  'caba': { lat: -34.6037, lng: -58.4200 },
  'palermo': { lat: -34.5889, lng: -58.4305 },
  'belgrano': { lat: -34.5627, lng: -58.4566 },
  'caballito': { lat: -34.6186, lng: -58.4428 },
  'almagro': { lat: -34.6105, lng: -58.4233 },
  'recoleta': { lat: -34.5875, lng: -58.3974 },
  'san telmo': { lat: -34.6212, lng: -58.3733 },
  'flores': { lat: -34.6300, lng: -58.4630 },
  'villa urquiza': { lat: -34.5724, lng: -58.4905 },
  'villa crespo': { lat: -34.5980, lng: -58.4410 },
  'nunez': { lat: -34.5450, lng: -58.4640 },
  'nuñez': { lat: -34.5450, lng: -58.4640 },
  'devoto': { lat: -34.6010, lng: -58.5130 },
  'saavedra': { lat: -34.5520, lng: -58.4900 },
  'vicente lopez': { lat: -34.5260, lng: -58.4850 },
  'vicente lópez': { lat: -34.5260, lng: -58.4850 },
  'olivos': { lat: -34.5100, lng: -58.4920 },
  'san isidro': { lat: -34.4720, lng: -58.5260 },
  'martinez': { lat: -34.4920, lng: -58.5100 },
  'martínez': { lat: -34.4920, lng: -58.5100 },
  'tigre': { lat: -34.4260, lng: -58.5796 },
  'san fernando': { lat: -34.4420, lng: -58.5600 },
  'gba norte': { lat: -34.4925, lng: -58.5306 },
  'norte': { lat: -34.4925, lng: -58.5306 },
  'avellaneda': { lat: -34.6624, lng: -58.3648 },
  'lanus': { lat: -34.7060, lng: -58.3920 },
  'lanús': { lat: -34.7060, lng: -58.3920 },
  'quilmes': { lat: -34.7242, lng: -58.2608 },
  'bernal': { lat: -34.7080, lng: -58.2810 },
  'lomas de zamora': { lat: -34.7600, lng: -58.4000 },
  'banfield': { lat: -34.7450, lng: -58.3980 },
  'gba sur': { lat: -34.7293, lng: -58.3242 },
  'sur': { lat: -34.7293, lng: -58.3242 },
  'moron': { lat: -34.6510, lng: -58.6180 },
  'morón': { lat: -34.6510, lng: -58.6180 },
  'ramos mejia': { lat: -34.6430, lng: -58.5620 },
  'ramos mejía': { lat: -34.6430, lng: -58.5620 },
  'castelar': { lat: -34.6530, lng: -58.6360 },
  'gba oeste': { lat: -34.6500, lng: -58.6200 },
  'oeste': { lat: -34.6500, lng: -58.6200 },
};

// Obtiene coordenadas aproximadas por zona o texto de dirección
export const getFallbackCoordinates = (addressText: string, zoneName?: string): Coordinates => {
  const text = `${addressText} ${zoneName || ''}`.toLowerCase();
  
  for (const [key, coords] of Object.entries(ZONE_CENTROIDS)) {
    if (text.includes(key)) {
      // Agregamos una ligera variación aleatoria determinista (jitter) para evitar que varios marcadores se encimen exactamente
      const hash = addressText.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const jitterLat = ((hash % 100) - 50) * 0.00015;
      const jitterLng = (((hash * 13) % 100) - 50) * 0.00015;
      return {
        lat: coords.lat + jitterLat,
        lng: coords.lng + jitterLng
      };
    }
  }

  // Fallback base: Centro de CABA
  return { lat: -34.6037, lng: -58.3816 };
};

// Geocodificación inteligente con memoria cache local
const CACHE_KEY = 'vibranfrut_geocode_cache_v1';
const getGeocodeCache = (): Record<string, Coordinates> => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveToGeocodeCache = (address: string, coords: Coordinates) => {
  try {
    const cache = getGeocodeCache();
    cache[address.trim().toLowerCase()] = coords;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('No se pudo guardar en cache de geocodificación:', e);
  }
};

export const geocodeAddress = async (address: string, zoneName?: string): Promise<{ coords: Coordinates; isApproximate: boolean }> => {
  const cleanAddress = address.trim();
  if (!cleanAddress) {
    return { coords: getFallbackCoordinates('', zoneName), isApproximate: true };
  }

  const cacheKey = cleanAddress.toLowerCase();
  const cache = getGeocodeCache();
  if (cache[cacheKey]) {
    return { coords: cache[cacheKey], isApproximate: false };
  }

  // Intentar geocodificar con OpenStreetMap Nominatim
  try {
    const query = `${cleanAddress}, ${zoneName || 'Buenos Aires'}, Argentina`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'es' }
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const coords: Coordinates = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        saveToGeocodeCache(cleanAddress, coords);
        return { coords, isApproximate: false };
      }
    }
  } catch (err) {
    console.warn('Geocodificador externo no disponible para:', cleanAddress, err);
  }

  // Fallback confiable si Nominatim no encuentra o hay corte de red
  const fallback = getFallbackCoordinates(cleanAddress, zoneName);
  saveToGeocodeCache(cleanAddress, fallback);
  return { coords: fallback, isApproximate: true };
};

// Cálculo de distancia entre 2 coordenadas (Fórmula Haversine en kilómetros)
export const calculateDistanceKm = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

// Algoritmo del Vecino más Cercano (Nearest Neighbor TSP) para ordenar paradas eficientemente
export const optimizeDeliveryRoute = (
  depotCoords: Coordinates, 
  stops: RouteStop[]
): RouteStop[] => {
  if (stops.length <= 1) return [...stops];

  const remaining = [...stops];
  const ordered: RouteStop[] = [];
  let currentPos = depotCoords;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceKm(currentPos, remaining[i].coordinates);
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestIndex = i;
      }
    }

    const nextStop = remaining.splice(nearestIndex, 1)[0];
    ordered.push(nextStop);
    currentPos = nextStop.coordinates;
  }

  return ordered;
};

// Calcula la distancia total y tiempo estimado de un recorrido
export const calculateRouteMetrics = (
  depotCoords: Coordinates, 
  stops: RouteStop[]
): { totalDistanceKm: number; estimatedMinutes: number } => {
  if (stops.length === 0) return { totalDistanceKm: 0, estimatedMinutes: 0 };

  let totalDist = 0;
  let currentPos = depotCoords;

  for (const stop of stops) {
    totalDist += calculateDistanceKm(currentPos, stop.coordinates);
    currentPos = stop.coordinates;
  }

  // Estimación de tiempo:
  // Velocidad promedio urbana de entrega en furgoneta / moto: 22 km/h
  // Tiempo promedio por parada de descarga: 7 minutos
  const drivingMinutes = (totalDist / 22) * 60;
  const stopMinutes = stops.length * 7;
  const totalMinutes = Math.round(drivingMinutes + stopMinutes);

  return {
    totalDistanceKm: Number(totalDist.toFixed(1)),
    estimatedMinutes: totalMinutes
  };
};

// Genera el enlace de navegación para Google Maps multi-parada
export const buildGoogleMapsRouteUrl = (
  depotAddress: string, 
  stops: RouteStop[]
): string => {
  if (stops.length === 0) return '';
  
  // Google Maps acepta hasta ~10 paradas en su URL estándar
  const allPoints = [depotAddress, ...stops.map(s => `${s.address}, ${s.zoneName || 'Buenos Aires'}`)];
  const encodedPoints = allPoints.map(p => encodeURIComponent(p)).join('/');
  
  return `https://www.google.com/maps/dir/${encodedPoints}`;
};
