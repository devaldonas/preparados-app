'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const CheckoutMP = dynamic(
  () => import('./CheckoutMP').then((mod) => mod.CheckoutMP),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin mx-auto text-[#FFB800]" size={32} />
        <p className="text-sm text-gray-500 mt-2">
          Carregando formulário de cartão...
        </p>
      </div>
    ),
  }
)

interface CheckoutMPWrapperProps {
  userId: string
  userEmail: string
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CheckoutMPWrapper(props: CheckoutMPWrapperProps) {
  return <CheckoutMP {...props} />
}
