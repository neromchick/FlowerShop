export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

export type ReactNode = import('react').ReactNode;

export interface ProductListItem {
  id: number;
  title: string;
  price: number;
  stockQuantity: number;
  description?: string;
  imageUrl?: string;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

export interface ProductQuery {
  categoryId?: number;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CartLine {
  productId: number;
  quantity: number;
}

export interface CartItem {
  productId: number;
  title: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface MergeCartRequest {
  items: CartLine[];
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  items: OrderItemRequest[];
}

export interface OrderItem {
  productTitleSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderSummary {
  id: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
}

export interface OrderDetail extends OrderSummary {
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
}

export type OrderStatus = 'New' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface AdminProduct {
  id: number;
  title: string;
  price: number;
  stockQuantity: number;
  description?: string;
  imageUrl?: string;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  title: string;
  price: number;
  stockQuantity: number;
  description?: string;
  categoryId: number;
  isActive: boolean;
}

export interface UpdateProductRequest {
  title: string;
  price: number;
  stockQuantity: number;
  description?: string;
  categoryId: number;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
  isActive: boolean;
}

export interface AdminOrderQuery {
  status?: OrderStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateOrderStatusRequest {
  newStatus: OrderStatus;
}

export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  accessToken: string;
  accessTokenExpires: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}