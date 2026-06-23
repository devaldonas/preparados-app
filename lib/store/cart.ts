// lib/store/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  max_stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void; // Novo método para sincronização
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getSubtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      setItems: (items) => {
        set({ items });
      },

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product_id === product.product_id
          );

          if (existingItem) {
            // Se já existe, atualiza a quantidade
            const newQuantity = Math.min(
              existingItem.quantity + quantity,
              existingItem.max_stock || 999
            );
            
            return {
              items: state.items.map((item) =>
                item.product_id === product.product_id
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
            };
          }

          // Se não existe, adiciona novo
          return {
            items: [
              ...state.items,
              {
                ...product,
                quantity: Math.min(quantity, product.max_stock || 999),
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId
              ? { 
                  ...item, 
                  quantity: Math.max(1, Math.min(quantity, item.max_stock || 999)) 
                }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getSubtotal: () => {
        return get().getTotalPrice();
      },
    }),
    {
      name: 'preparado-cart',
    }
  )
);