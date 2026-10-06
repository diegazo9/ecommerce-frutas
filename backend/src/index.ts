import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import shippingRoutes from './routes/shippingRoutes';
import uploadRoutes from './routes/uploadRoutes';

const app = express();

// Confiar en el proxy inverso de Render para identificar correctamente las IPs
app.set('trust proxy', 1);

// Cabeceras de seguridad HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Configuración CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como apps móviles, curl, o webhooks de Mercado Pago)
    if (!origin) return callback(null, true);

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
    const isVercel = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isRender = /^https:\/\/.*\.onrender\.com$/.test(origin);
    const isCustomDomain = /vibranfrut|ecommerce/.test(origin);

    if (isLocalhost || isVercel || isRender || isCustomDomain) {
      return callback(null, true);
    }
    // En caso de otro origen, permitir o registrar
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir carpeta de uploads estáticos para fotos de productos
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Limitador de tasa contra ataques de fuerza bruta en autenticación (Login / Register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo 30 intentos por IP cada 15 min
  message: { error: 'Demasiados intentos. Por favor intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador general de la API para prevenir DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600, // 600 peticiones cada 15 min por IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.get('/', (req, res) => {
  res.json({ status: 'API Online', message: 'Ecommerce Frutas Backend' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping-zones', shippingRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Agente Backend] Servidor corriendo en el puerto ${PORT}`);
});
