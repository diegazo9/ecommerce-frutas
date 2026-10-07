export const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  unit: string;
  categoryId: number;
  imageUrl: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface Category {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
}

export interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  [key: string]: any;
}

export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) throw new Error('Error fetch products');
  return response.json();
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_URL}/products/categories`);
  if (!response.ok) throw new Error('Error fetch categories');
  return response.json();
};

export const getOrders = async (token: string): Promise<Order[]> => {
  const response = await fetch(`${API_URL}/orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Error al obtener ordenes');
  return response.json();
};

export const updateOrderStatus = async (id: number, status: string, token: string): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Error al actualizar estado de orden');
  return response.json();
};

export const cancelOrder = async (id: number, token: string): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders/${id}/cancel`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al cancelar orden');
  }
  return response.json();
};

export const payOrderWithCash = async (id: number, token: string): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders/${id}/pay-cash`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al actualizar a pago en efectivo');
  }
  return response.json();
};

export const payOrderWithMercadoPago = async (id: number, token: string): Promise<{ initPoint: string }> => {
  const response = await fetch(`${API_URL}/orders/${id}/pay-mp`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al conectar con Mercado Pago');
  }
  return response.json();
};

// Auth Functions
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Credenciales inválidas');
  }
  return response.json();
};

export const registerUser = async (name: string, email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al registrar el usuario');
  }
  return response.json();
};

export const googleLogin = async (token: string) => {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error con Google Auth');
  }
  return response.json();
};

export interface ShippingZone {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export const getShippingZones = async (): Promise<ShippingZone[]> => {
  const response = await fetch(`${API_URL}/shipping-zones`);
  if (!response.ok) throw new Error('Error fetch shipping zones');
  return response.json();
};

export const createShippingZone = async (data: Omit<ShippingZone, 'id'>, token: string): Promise<ShippingZone> => {
  const response = await fetch(`${API_URL}/shipping-zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error creating shipping zone');
  return response.json();
};

export const updateShippingZone = async (id: number, data: Partial<ShippingZone>, token: string): Promise<ShippingZone> => {
  const response = await fetch(`${API_URL}/shipping-zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error updating shipping zone');
  return response.json();
};

export const deleteShippingZone = async (id: number, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/shipping-zones/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Error deleting shipping zone');
};

// Admin Functions (require token)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error('Error creando producto');
  return response.json();
};

export const updateProduct = async (id: number, productData: Partial<Product>): Promise<Product> => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error('Error actualizando producto');
  return response.json();
};

export const deleteProduct = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error eliminando producto');
};

export const createCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  const response = await fetch(`${API_URL}/products/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData)
  });
  if (!response.ok) throw new Error('Error creando categoría');
  return response.json();
};

export const updateCategory = async (id: number, categoryData: Partial<Category>): Promise<Category> => {
  const response = await fetch(`${API_URL}/products/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData)
  });
  if (!response.ok) throw new Error('Error actualizando categoría');
  return response.json();
};

export const deleteCategory = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/products/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error eliminando categoría');
};

export const uploadImage = async (base64Image: string): Promise<string> => {
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ image: base64Image })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error subiendo imagen al servidor');
  }
  const data = await response.json();
  return data.url;
};

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  recentOrders?: Array<{
    id: number;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await fetch(`${API_URL}/auth/users`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al obtener usuarios');
  }
  return response.json();
};

export const updateUserRole = async (id: number, role: 'CUSTOMER' | 'ADMIN'): Promise<AdminUser> => {
  const response = await fetch(`${API_URL}/auth/users/${id}/role`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar rol del usuario');
  }
  return response.json();
};

