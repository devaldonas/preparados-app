// app/admin/produtos/page.tsx (REFINADO)
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import UploadMultiplasImagens from '@/components/UploadMultiplasImagens'
import { 
  Plus, Edit, Trash2, Eye, Package, 
  Search, Filter, ChevronDown, ChevronUp,
  Check, X, AlertCircle, Save, Upload
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string
  images: string[]
  stock: number
  mochila_tipo: string[]
  is_active: boolean
  created_at: string
}

export default function AdminProdutos() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('todos')
  const [filterActive, setFilterActive] = useState('todos')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const router = useRouter()

  // Estados para o formulário de edição
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    mochila_tipo: [] as string[]
  })

  const mochilaTipos = ['EDC', 'BOB', 'BOLT']

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
      
      // Extrair categorias únicas
      const uniqueCategories = [...new Set(data?.map(p => p.category) || [])]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId)

      if (error) throw error

      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_active: !currentStatus } : p
      ))

      setSuccessMessage(`Produto ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setErrorMessage('Erro ao atualizar status do produto')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      stock: product.stock,
      mochila_tipo: product.mochila_tipo || []
    })
    setImageUrls(product.images || (product.image_url ? [product.image_url] : []))
    setShowEditModal(true)
  }

  const handleImagesUploadComplete = (urls: string[]) => {
    setImageUrls(urls)
  }

  const handleSaveEdit = async () => {
    if (!editingProduct) return

    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (imageUrls.length === 0) {
        setErrorMessage('Adicione pelo menos uma imagem do produto')
        setSaving(false)
        return
      }

      const updateData = {
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        category: editForm.category,
        stock: editForm.stock,
        mochila_tipo: editForm.mochila_tipo,
        image_url: imageUrls[0],
        images: imageUrls,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editingProduct.id)

      if (error) throw error

      setSuccessMessage('Produto atualizado com sucesso!')
      
      // Atualizar lista
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, ...updateData } : p
      ))

      setTimeout(() => {
        setShowEditModal(false)
        setSuccessMessage('')
        setImageUrls([])
      }, 1500)

    } catch (error) {
      console.error('Erro ao salvar:', error)
      setErrorMessage('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleTipoChange = (tipo: string) => {
    setEditForm(prev => ({
      ...prev,
      mochila_tipo: prev.mochila_tipo.includes(tipo)
        ? prev.mochila_tipo.filter(t => t !== tipo)
        : [...prev.mochila_tipo, tipo]
    }))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = filterCategory === 'todos' || product.category === filterCategory
    const matchActive = filterActive === 'todos' || 
                       (filterActive === 'ativo' && product.is_active) ||
                       (filterActive === 'inativo' && !product.is_active)
    
    return matchSearch && matchCategory && matchActive
  })

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
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"> Gerenciar Produtos</h1>
            <p className="text-gray-500 text-sm">Gerencie todos os produtos da loja</p>
          </div>
          <Link href="/admin/produtos/novo">
            <button className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-display font-bold px-4 py-2 rounded-lg transition flex items-center gap-2">
              <Plus size={18} />
              Novo Produto
            </button>
          </Link>
        </div>

        {/* Mensagens */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={18} />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
                />
              </div>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
            >
              <option value="todos">Todas categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#FFB800] outline-none"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-display font-bold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={product.image_url || '/images/placeholder.jpg'}
                              alt={product.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => { e.currentTarget.src = '/images/placeholder.jpg' }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {product.description || 'Sem descrição'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-display font-bold text-[#FFB800]">
                          {formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          product.stock === 0 ? 'text-red-500' :
                          product.stock < 5 ? 'text-orange-500' :
                          'text-green-600'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                            product.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <Link href={`/loja/produto/${product.id}`} target="_blank">
                            <button
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              title="Visualizar na loja"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total de produtos */}
        <div className="mt-4 text-sm text-gray-500">
          Total: {filteredProducts.length} produtos
          {searchTerm && ` (filtrados de ${products.length})`}
        </div>
      </div>

      {/* Modal de Edição com Upload de Imagens */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Editar Produto</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setImageUrls([])
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none resize-none"
                  />
                </div>

                {/* Preço e Estoque */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque *
                    </label>
                    <input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) => setEditForm({...editForm, stock: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#FFB800] outline-none"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Upload de Imagens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagens do Produto * (até 5)
                  </label>
                  <UploadMultiplasImagens 
                    onUploadComplete={handleImagesUploadComplete}
                    currentImages={imageUrls}
                    maxImages={5}
                    produtoNome={editForm.name || 'produto'}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Adicione até 5 imagens. A primeira imagem será a principal.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tamanho máximo: 2MB por imagem • Formatos: JPG, PNG, WEBP • Dimensão recomendada: 800x800 pixels
                  </p>
                </div>

                {/* Compatibilidade com mochila */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compatível com tipos de mochila
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {mochilaTipos.map((tipo) => (
                      <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.mochila_tipo.includes(tipo)}
                          onChange={() => handleTipoChange(tipo)}
                          className="w-4 h-4 text-[#FFB800] rounded focus:ring-[#FFB800]"
                        />
                        <span className="text-sm text-gray-700">{tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setImageUrls([])
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}