import express from 'express';
import cors from 'cors';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import shippingRoutes from './routes/shippingRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'API Online', message: 'Ecommerce Frutas Backend' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping-zones', shippingRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Agente Backend] Servidor corriendo en el puerto ${PORT}`);
});
