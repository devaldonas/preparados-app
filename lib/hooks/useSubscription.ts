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
    daysLeft: 7,
    trialEndDate: null,
    isExpired: false
  })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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

      // Verificar se é admin
      const { data: profileRole } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileRole?.role === 'admin') {
        setIsAdmin(true)
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_status, trial_end_date')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Se não tiver dados de trial, criar
      if (!profile?.trial_end_date || !profile?.subscription_status) {
        const startDate = new Date()
        const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        await supabase
          .from('profiles')
          .update({
            trial_start_date: startDate.toISOString(),
            trial_end_date: endDate.toISOString(),
            subscription_status: 'trial'
          })
          .eq('id', user.id)

        setStatus({
          status: 'trial',
          daysLeft: 7,
          trialEndDate: endDate,
          isExpired: false
        })
        setLoading(false)
        return
      }

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

  return { status, loading, isAdmin }
}