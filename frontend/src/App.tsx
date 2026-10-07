import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Cart } from './pages/Cart';
import { Products } from './pages/Products';
import { About } from './pages/About';
import { Shipping } from './pages/Shipping';
import { Wholesale } from './pages/Wholesale';
import { Recipes } from './pages/Recipes';
import { Combos } from './pages/Combos';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { AdminProducts } from './pages/AdminProducts';
import { AdminCategories } from './pages/AdminCategories';
import { AdminShipping } from './pages/AdminShipping';
import { AdminOrders } from './pages/AdminOrders';
import { AdminSettings } from './pages/AdminSettings';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminFinance } from './pages/AdminFinance';
import { Login } from './pages/Login';
import { CustomerProfile } from './pages/CustomerProfile';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Rutas Públicas y del Cliente (usan Layout) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="productos" element={<Products />} />
              <Route path="combos" element={<Combos />} />
              <Route path="nosotros" element={<About />} />
              <Route path="envios" element={<Shipping />} />
              <Route path="mayorista" element={<Wholesale />} />
              <Route path="recetas" element={<Recipes />} />
              <Route path="cart" element={<Cart />} />
              <Route path="profile" element={<CustomerProfile />} />
            </Route>
            
            <Route path="/login" element={<Login />} />

            {/* Rutas de Administración */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
