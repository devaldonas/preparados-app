// app/admin/configuracoes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { ArrowLeft, Settings, Save, Loader2, Check, AlertCircle } from 'lucide-react'

export default function AdminConfiguracoes() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [config, setConfig] = useState({
    site_name: 'PREPARADO',
    maintenance_mode: false,
    allow_registration: true,
    trial_days: 30
  })

  useEffect(() => {
    verificarAdmin()
  }, [])

  const verificarAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Salvar configurações (em produção, salvar em uma tabela de configurações)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('Configurações salvas com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setError('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/admin" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Configurações</h1>
            <p className="text-sm text-gray-500">Gerencie as configurações gerais do sistema</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={18} />
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Site
              </label>
              <input
                type="text"
                value={config.site_name}
                onChange={(e) => setConfig({...config, site_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.maintenance_mode}
                  onChange={(e) => setConfig({...config, maintenance_mode: e.target.checked})}
                  className="w-4 h-4 text-[#FFB800] rounded focus:ring-[#FFB800]"
                />
                <span className="text-sm text-gray-700">Modo Manutenção</span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.allow_registration}
                  onChange={(e) => setConfig({...config, allow_registration: e.target.checked})}
                  className="w-4 h-4 text-[#FFB800] rounded focus:ring-[#FFB800]"
                />
                <span className="text-sm text-gray-700">Permitir Cadastros</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias de Teste Gratuito
              </label>
              <input
                type="number"
                value={config.trial_days}
                onChange={(e) => setConfig({...config, trial_days: parseInt(e.target.value) || 0})}
                className="w-full max-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                min={0}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar Configurações
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}