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
import settingsRoutes from './routes/settingsRoutes';
import { prisma } from './prisma';

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
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`[Agente Backend] Servidor corriendo en el puerto ${PORT}`);
  
  // Asegurar que la columna is_verified exista en la tabla users
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    `);
    console.log('[DB] Columna is_verified verificada en tabla users');
  } catch (err: any) {
    console.warn('[DB] Nota sobre columna is_verified:', err?.message);
  }

  // Asegurar que las secuencias de IDs en PostgreSQL estén sincronizadas con MAX(id)
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
          PERFORM setval(pg_get_serial_sequence('users', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM users), 0), 1));
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
          PERFORM setval(pg_get_serial_sequence('orders', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM orders), 0), 1));
        END IF;
      END $$;
    `);
    console.log('[DB] Secuencias de PostgreSQL sincronizadas exitosamente');
  } catch (seqErr: any) {
    console.warn('[DB] Nota sobre sincronización de secuencias:', seqErr?.message);
  }

  // Limpiar menciones de Huerta / Huerto en los productos de la base de datos
  try {
    const productsToClean = await prisma.product.findMany();
    for (const p of productsToClean) {
      let changed = false;
      let newName = p.name;
      let newDesc = p.description || '';

      if (/huerto familiar/i.test(newName)) {
        newName = newName.replace(/huerto familiar/gi, 'Familiar Semanal');
        changed = true;
      }
      if (/bols[oó]n huerto/i.test(newName)) {
        newName = newName.replace(/bols[oó]n huerto/gi, 'Bolsón');
        changed = true;
      }
      if (/de huerta fresca/i.test(newName)) {
        newName = newName.replace(/de huerta fresca/gi, 'Frescas');
        changed = true;
      }
      if (/de huerta/i.test(newName)) {
        newName = newName.replace(/de huerta/gi, 'Fresca');
        changed = true;
      }
      if (/del huerto/i.test(newName)) {
        newName = newName.replace(/del huerto/gi, 'Fresca');
        changed = true;
      }
      if (/huerta/i.test(newName)) {
        newName = newName.replace(/huerta/gi, 'Estación');
        changed = true;
      }
      if (/huerto/i.test(newName)) {
        newName = newName.replace(/huerto/gi, 'Estación');
        changed = true;
      }

      if (newDesc && /huert[oa]/i.test(newDesc)) {
        newDesc = newDesc
          .replace(/de la huerta/gi, 'de estación')
          .replace(/del huerto/gi, 'de estación')
          .replace(/de huerta/gi, 'de estación')
          .replace(/huerta/gi, 'estación')
          .replace(/huerto/gi, 'estación');
        changed = true;
      }

      if (changed) {
        await prisma.product.update({
          where: { id: p.id },
          data: { name: newName, description: newDesc }
        });
        console.log(`[DB] Producto #${p.id} renombrado a "${newName}"`);
      }
    }
    console.log('[DB] Productos actualizados sin referencias a huerta');
  } catch (cleanErr: any) {
    console.warn('[DB] Nota sobre actualización de productos:', cleanErr?.message);
  }
});
