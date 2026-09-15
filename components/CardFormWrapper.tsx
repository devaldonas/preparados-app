'use client'

import { CheckoutMP } from './CheckoutMP'

interface CardFormWrapperProps {
  userId: string
  userEmail: string
  plan: 'monthly' | 'annual'
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
}

export function CardFormWrapper(props: CardFormWrapperProps) {
  return <CheckoutMP {...props} />
}
