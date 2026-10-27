import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, CartItem, ProductListItem } from '../types';
import { cartApi } from '../api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (
    product: ProductListItem | CartItem | { id: number; title?: string; price?: number; stockQuantity?: number; imageUrl?: string },
    quantity?: number
  ) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadServerCart: () => Promise<void>;
  isLoaded: boolean;
  toastMessage: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'flowershop_cart_v2';
const LEGACY_STORAGE_KEYS = ['atelier_flora_cart_v2', 'flowershop_cart'];

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const isMergingRef = useRef(false);

  // Show auto-dismissing toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const loadServerCart = useCallback(async () => {
    try {
      const { data } = await cartApi.getCart();
      setItems(data);
    } catch (err) {
      console.error('Failed to load server cart:', err);
    }
  }, []);

  // Helper to read any stored guest cart
  const readGuestCart = (): CartItem[] => {
    let raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
          raw = legacy;
          localStorage.removeItem(legacyKey);
          break;
        }
      }
    }
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  };

  // Sync / initialize cart depending on auth status transitions
  useEffect(() => {
    if (authLoading) return;

    const currentUserId = user?.id || null;
    const prevUserId = prevUserIdRef.current;

    // First initialization
    if (prevUserId === undefined) {
      prevUserIdRef.current = currentUserId;
      if (currentUserId) {
        // User was already logged in on page load
        const guestItems = readGuestCart();
        localStorage.removeItem(CART_STORAGE_KEY);
        for (const k of LEGACY_STORAGE_KEYS) localStorage.removeItem(k);

        if (guestItems.length > 0) {
          cartApi
            .mergeCart(guestItems.map((i) => ({ productId: i.productId, quantity: i.quantity })))
            .then(() => loadServerCart())
            .catch(() => loadServerCart())
            .finally(() => setIsLoaded(true));
        } else {
          loadServerCart().finally(() => setIsLoaded(true));
        }
      } else {
        // Guest on page load
        const guestItems = readGuestCart();
        setItems(guestItems);
        setIsLoaded(true);
      }
      return;
    }

    // Auth status changed:
    // 1. Guest -> Logged In: Merge guest cart once and clear storage synchronously
    if (prevUserId === null && currentUserId !== null) {
      prevUserIdRef.current = currentUserId;
      if (isMergingRef.current) return;
      isMergingRef.current = true;

      const guestItems = readGuestCart();
      localStorage.removeItem(CART_STORAGE_KEY);
      for (const k of LEGACY_STORAGE_KEYS) localStorage.removeItem(k);

      if (guestItems.length > 0) {
        cartApi
          .mergeCart(guestItems.map((i) => ({ productId: i.productId, quantity: i.quantity })))
          .then(() => loadServerCart())
          .catch(() => loadServerCart())
          .finally(() => {
            isMergingRef.current = false;
          });
      } else {
        loadServerCart().finally(() => {
          isMergingRef.current = false;
        });
      }
      return;
    }

    // 2. Logged In -> Logged Out: Wipe memory cart and guest storage so items do not leak
    if (prevUserId !== null && currentUserId === null) {
      prevUserIdRef.current = currentUserId;
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      for (const k of LEGACY_STORAGE_KEYS) localStorage.removeItem(k);
      return;
    }

    // 3. User changed to different user
    if (prevUserId !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      if (currentUserId) {
        loadServerCart();
      } else {
        setItems([]);
      }
    }
  }, [user, authLoading, loadServerCart]);

  // Save guest cart changes to localStorage (only when guest)
  useEffect(() => {
    if (isLoaded && !user) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded, user]);

  const addItem = async (
    product: ProductListItem | CartItem | { id: number; title?: string; price?: number; stockQuantity?: number; imageUrl?: string },
    quantity = 1
  ) => {
    const productId = 'id' in product ? product.id : product.productId;
    const title = product.title || `Товар #${productId}`;
    const price = product.price || 0;
    const stockQuantity = product.stockQuantity ?? 99;
    const imageUrl = product.imageUrl;

    if (user) {
      // Logged-in user: use updateItem if exists to avoid accidental duplication, or mergeCart if new
      try {
        const existing = items.find((i) => i.productId === productId);
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, existing.stockQuantity || stockQuantity);
          const { data } = await cartApi.updateItem(productId, newQty);
          setItems(data);
        } else {
          await cartApi.mergeCart([{ productId, quantity }]);
          await loadServerCart();
        }
        showToast('Букет добавлен · Бесплатно вложили подкормку Кризал и инструкцию по уходу');
      } catch (err) {
        console.error('Failed to add item to server cart:', err);
      }
    } else {
      // Guest user: update state & localStorage
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, existing.stockQuantity || stockQuantity);
          return prev.map((item) =>
            item.productId === productId ? { ...item, quantity: newQty } : item
          );
        }
        return [
          ...prev,
          {
            productId,
            title,
            price,
            stockQuantity,
            imageUrl,
            quantity: Math.min(quantity, stockQuantity),
          },
        ];
      });
      showToast('Букет добавлен · Бесплатно вложили подкормку Кризал и инструкцию по уходу');
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    if (user) {
      try {
        const { data } = await cartApi.updateItem(productId, quantity);
        setItems(data);
      } catch (err) {
        console.error('Failed to update quantity on server:', err);
      }
    } else {
      setItems((prev) =>
        prev.map((item) => {
          if (item.productId === productId) {
            const max = item.stockQuantity > 0 ? item.stockQuantity : 99;
            return { ...item, quantity: Math.min(quantity, max) };
          }
          return item;
        })
      );
    }
  };

  const removeItem = async (productId: number) => {
    if (user) {
      try {
        const { data } = await cartApi.removeItem(productId);
        setItems(data);
      } catch (err) {
        console.error('Failed to remove item on server:', err);
      }
    } else {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await cartApi.clearCart();
        setItems([]);
      } catch (err) {
        console.error('Failed to clear server cart:', err);
      }
    } else {
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      for (const k of LEGACY_STORAGE_KEYS) localStorage.removeItem(k);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        loadServerCart,
        isLoaded,
        toastMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
