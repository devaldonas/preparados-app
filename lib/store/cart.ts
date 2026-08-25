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
  is_digital?: boolean;
  free_shipping?: boolean;
}

interface CartStore {
  items: CartItem[];
  usarCreditos: boolean;
  valorCreditos: number;
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getSubtotal: () => number;
  toggleUsarCreditos: () => void;
  setValorCreditos: (valor: number) => void;
  getTotalComCreditos: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      usarCreditos: false,
      valorCreditos: 0,

      setItems: (items) => {
        set({ items });
      },

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product_id === product.product_id
          );

          if (existingItem) {
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
        set({ items: [], usarCreditos: false, valorCreditos: 0 });
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

      // NOVAS FUNÇÕES PARA CRÉDITOS
      toggleUsarCreditos: () => {
        set((state) => ({ usarCreditos: !state.usarCreditos }));
      },

      setValorCreditos: (valor: number) => {
        set({ valorCreditos: valor });
      },

      getTotalComCreditos: () => {
        const total = get().getTotalPrice();
        const creditos = get().usarCreditos ? get().valorCreditos : 0;
        return Math.max(0, total - creditos);
      },
    }),
    {
      name: 'preparado-cart',
    }
  )
);
