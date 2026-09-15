'use client'

import dynamic from 'next/dynamic'

const CheckoutMP = dynamic(
  () => import('./CheckoutMP').then(mod => mod.CheckoutMP),
  { ssr: false }
)

interface CheckoutMPWrapperProps {
  userId: string
  userEmail: string
  plan: 'monthly' | 'annual'
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CheckoutMPWrapper(props: CheckoutMPWrapperProps) {
  return <CheckoutMP {...props} />
}