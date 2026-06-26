// lib/hooks/useSubscription.ts
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  daysLeft: number
  trialEndDate: Date | null
  isExpired: boolean
}

export function useSubscription() {
  const router = useRouter()
  const [status, setStatus] = useState<SubscriptionStatus>({
    status: 'trial',
    daysLeft: 30,
    trialEndDate: null,
    isExpired: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verificarStatus()
  }, [])

  const verificarStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, trial_end_date')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null
      const now = new Date()
      const isExpired = trialEndDate ? now > trialEndDate : false

      let daysLeft = 0
      if (trialEndDate && !isExpired) {
        const diff = trialEndDate.getTime() - now.getTime()
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
      }

      setStatus({
        status: profile.subscription_status || 'trial',
        daysLeft,
        trialEndDate,
        isExpired
      })

    } catch (error) {
      console.error('Erro ao verificar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  return { status, loading }
}