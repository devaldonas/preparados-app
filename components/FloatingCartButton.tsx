// components/FloatingCartButton.tsx
'use client'

import Link from 'next/link'
import { useCart } from '@/lib/store/cart'
import { ShoppingBag } from 'lucide-react'

export default function FloatingCartButton() {
  const { getTotalItems } = useCart()
  const cartCount = getTotalItems()

  if (cartCount === 0) return null

  return (
    <Link
      href="/loja/carrinho"
      className="fixed bottom-6 right-6 z-40 bg-[#FFB800] text-black p-4 rounded-full shadow-lg hover:bg-[#E5A600] transition-all hover:scale-105 flex items-center justify-center"
    >
      <ShoppingBag size={24} />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  )
}