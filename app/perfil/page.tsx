// app/perfil/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import NavBar from '@/components/NavBar'
import { ArrowLeft, User, Mail, MapPin, Edit, Save, Loader2, Check, AlertCircle } from 'lucide-react'

export default function Perfil() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    cep: '',
    mochila_tipo: 'BOB'
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // 🔥 CORRIGIDO: buscar perfil com as any
      const { data: profileData, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar perfil:', error)
        return
      }

      setProfile(profileData)
      setFormData({
        full_name: profileData?.full_name || '',
        cep: profileData?.cep || '',
        mochila_tipo: profileData?.mochila_tipo || 'BOB'
      })
    } catch (error) {
      console.error('Erro:', error)
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
      if (!user) throw new Error('Usuário não autenticado')

      // 🔥 CORRIGIDO: atualizar perfil com as any
      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: formData.full_name,
          cep: formData.cep,
          mochila_tipo: formData.mochila_tipo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Perfil atualizado com sucesso!')
      setEditMode(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setError('Erro ao atualizar perfil')
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
      <NavBar showBackButton={true} backButtonPath="/dashboard" />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👤 Meu Perfil</h1>
            <p className="text-sm text-gray-500">Gerencie suas informações pessoais</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  disabled={!editMode}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: e.target.value})}
                  disabled={!editMode}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Mochila
              </label>
              <select
                value={formData.mochila_tipo}
                onChange={(e) => setFormData({...formData, mochila_tipo: e.target.value})}
                disabled={!editMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="EDC">EDC - Every Day Carry</option>
                <option value="BOB">BOB - Bug Out Bag</option>
                <option value="BOLT">BOLT - Bug Out Long Term</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {!editMode ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-black font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false)
                      if (profile) {
                        setFormData({
                          full_name: profile.full_name || '',
                          cep: profile.cep || '',
                          mochila_tipo: profile.mochila_tipo || 'BOB'
                        })
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#FFB800] hover:bg-[#E5A600] text-black py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Salvar
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}