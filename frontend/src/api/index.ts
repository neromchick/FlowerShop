import api from './client';
import type {
  Category,
  ProductListItem,
  ProductQuery,
  PagedResult,
  CartItem,
  CartLine,
  MergeCartRequest,
  CreateOrderRequest,
  OrderDetail,
  OrderSummary,
  AdminProduct,
  CreateProductRequest,
  UpdateProductRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  AdminOrderQuery,
  UpdateOrderStatusRequest,
  AuthResponse,
  UserProfile,
  RegisterRequest,
  LoginRequest,
  GoogleAuthRequest,
  UpdateProfileRequest,
} from '../types';

export const catalogApi = {
  getCategories: () => api.get<Category[]>('/catalog/categories'),
  getProducts: (query: ProductQuery) => api.get<PagedResult<ProductListItem>>('/catalog/products', { params: query }),
  getProductById: (id: number) => api.get<ProductListItem>(`/catalog/products/${id}`),
  getProductsBatch: (ids: number[]) => api.get<ProductListItem[]>('/catalog/products/batch', { params: { ids } }),
};

export const cartApi = {
  getCart: () => api.get<CartItem[]>('/cart'),
  mergeCart: (items: CartLine[]) => api.post<CartItem[]>('/cart/merge', { items } as MergeCartRequest),
  updateItem: (productId: number, quantity: number) => api.put<CartItem[]>(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId: number) => api.delete<CartItem[]>(`/cart/items/${productId}`),
  clearCart: () => api.delete('/cart'),
};

export const orderApi = {
  createOrder: (request: CreateOrderRequest) => api.post<OrderDetail>('/orders', request),
  getMyOrders: () => api.get<OrderSummary[]>('/orders/my'),
  getMyOrder: (id: number) => api.get<OrderDetail>(`/orders/my/${id}`),
};

export const adminCategoryApi = {
  getAll: () => api.get<Category[]>('/admin/categories'),
  create: (request: CreateCategoryRequest) => api.post<Category>('/admin/categories', request),
  update: (id: number, request: UpdateCategoryRequest) => api.put<Category>(`/admin/categories/${id}`, request),
  delete: (id: number) => api.delete(`/admin/categories/${id}`),
};

export const adminProductApi = {
  getProducts: (page = 1, pageSize = 20) => api.get<PagedResult<AdminProduct>>('/admin/products', { params: { page, pageSize } }),
  create: (request: CreateProductRequest) => api.post<AdminProduct>('/admin/products', request),
  update: (id: number, request: UpdateProductRequest) => api.put<AdminProduct>(`/admin/products/${id}`, request),
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<AdminProduct>(`/admin/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deactivate: (id: number) => api.delete(`/admin/products/${id}`),
};

export const adminOrderApi = {
  getOrders: (query: AdminOrderQuery) => api.get<PagedResult<OrderSummary>>('/admin/orders', { params: query }),
  getOrder: (id: number) => api.get<OrderDetail>(`/admin/orders/${id}`),
  updateStatus: (id: number, request: UpdateOrderStatusRequest) => api.patch<OrderDetail>(`/admin/orders/${id}/status`, request),
};

export const authApi = {
  register: (request: RegisterRequest) => api.post<AuthResponse>('/auth/register', request),
  login: (request: LoginRequest) => api.post<AuthResponse>('/auth/login', request),
  googleLogin: (idToken: string) => api.post<AuthResponse>('/auth/google', { idToken } as GoogleAuthRequest),
  refresh: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  getProfile: () => api.get<UserProfile>('/auth/me'),
  updateProfile: (request: UpdateProfileRequest) => api.put<UserProfile>('/auth/profile', request),
};
