'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

interface UploadImagemProps {
  onUploadComplete: (url: string) => void
  currentImage?: string
  produtoNome?: string
}

export default function UploadImagem({ onUploadComplete, currentImage, produtoNome }: UploadImagemProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || '')
  const [error, setError] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validacoes
    const maxSize = 2 * 1024 * 1024 // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxWidth = 800
    const maxHeight = 800

    setError('')

    // Validar tamanho
    if (file.size > maxSize) {
      setError('Imagem muito grande. Maximo 2MB')
      return
    }

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      setError('Formato nao permitido. Use JPG, PNG ou WEBP')
      return
    }

    // Validar dimensoes
    const img = new Image()
    const imgUrl = URL.createObjectURL(file)
    
    await new Promise((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(imgUrl)
        resolve(null)
      }
      img.src = imgUrl
    })

    if (img.width > maxWidth || img.height > maxHeight) {
      setError(`Imagem muito grande. Maximo ${maxWidth}x${maxHeight}px`)
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      
      // Upload para o Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obter URL publica
      const { data: { publicUrl } } = supabase.storage
        .from('produtos')
        .getPublicUrl(fileName)

      setPreview(publicUrl)
      onUploadComplete(publicUrl)
      
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      setError('Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {preview && (
          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1">
          <label className="block">
            <span className="sr-only">Escolher imagem</span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-[#FFB800] file:text-black
                hover:file:bg-[#E5A600]
                disabled:opacity-50"
            />
          </label>
          {produtoNome && preview && (
            <p className="text-xs text-gray-500 mt-1">
              Sugestão de nome: {produtoNome.toLowerCase().replace(/ /g, '-')}.jpg
            </p>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-semibold">Especificacoes da imagem:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Tamanho maximo: 2MB</li>
          <li>Dimensao: 800x800 pixels (quadrada)</li>
          <li>Formatos: JPG, PNG, WEBP</li>
          <li>Cor de fundo: recomendado branco ou transparente</li>
        </ul>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {uploading && (
        <p className="text-sm text-[#FFB800]">Enviando imagem...</p>
      )}
    </div>
  )
}