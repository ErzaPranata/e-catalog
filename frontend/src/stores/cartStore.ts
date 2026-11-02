import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, ProductListItem, ProductVariant } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (product: ProductListItem, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variant, quantity = 1) => {
        const variantId = variant?.id;
        
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.productId === product.id && item.variantId === variantId
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            const availableStock = variant?.stock ?? product.stock;
            const newQuantity = Math.min(
              newItems[existingIndex].quantity + quantity,
              availableStock
            );
            newItems[existingIndex].quantity = newQuantity;
            return { items: newItems };
          }

          const availableStock = variant?.stock ?? product.stock;
          const newItem: CartItem = {
            productId: product.id,
            variantId,
            quantity: Math.min(quantity, availableStock),
            product,
            variant,
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => {
          const item = state.items.find(
            (i) => i.productId === productId && i.variantId === variantId
          );
          if (!item) return state;

          const availableStock = item.variant?.stock ?? item.product.stock;
          const newQuantity = Math.min(quantity, availableStock);

          return {
            items: state.items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: newQuantity }
                : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.variant?.price ?? item.product.price;
          const unitPrice = typeof price === 'object' ? price.min : price;
          return sum + unitPrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);