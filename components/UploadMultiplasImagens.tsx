'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

interface UploadMultiplasImagensProps {
  onUploadComplete: (urls: string[]) => void
  currentImages?: string[]
  maxImages?: number
  produtoNome?: string
}

export default function UploadMultiplasImagens({ 
  onUploadComplete, 
  currentImages = [], 
  maxImages = 5,
  produtoNome 
}: UploadMultiplasImagensProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(currentImages)
  const [error, setError] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > maxImages) {
      setError(`Maximo de ${maxImages} imagens por produto`)
      return
    }

    setUploading(true)
    setError('')

    const newImages: string[] = []

    for (const file of Array.from(files)) {
      // Validacoes
      const maxSize = 2 * 1024 * 1024
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

      if (file.size > maxSize) {
        setError(`Imagem ${file.name} muito grande. Maximo 2MB`)
        continue
      }

      if (!allowedTypes.includes(file.type)) {
        setError(`Formato ${file.name} nao permitido. Use JPG, PNG ou WEBP`)
        continue
      }

      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('produtos')
          .getPublicUrl(fileName)

        newImages.push(publicUrl)
      } catch (err) {
        console.error('Erro ao fazer upload:', err)
        setError(`Erro ao enviar ${file.name}`)
      }
    }

    const allImages = [...images, ...newImages]
    setImages(allImages)
    onUploadComplete(allImages)
    setUploading(false)
  }

  const removerImagem = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onUploadComplete(newImages)
  }

  const moverImagem = (index: number, direcao: 'up' | 'down') => {
    const newImages = [...images]
    if (direcao === 'up' && index > 0) {
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]]
    } else if (direcao === 'down' && index < images.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    }
    setImages(newImages)
    onUploadComplete(newImages)
  }

  return (
    <div className="space-y-3">
      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img 
                src={url}
                alt={`Imagem ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-1">
                <button
                  onClick={() => moverImagem(index, 'up')}
                  disabled={index === 0}
                  className="bg-white text-black w-6 h-6 rounded-full text-xs disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => moverImagem(index, 'down')}
                  disabled={index === images.length - 1}
                  className="bg-white text-black w-6 h-6 rounded-full text-xs disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  onClick={() => removerImagem(index)}
                  className="bg-red-500 text-white w-6 h-6 rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão de upload */}
      {images.length < maxImages && (
        <div>
          <label className="block">
            <span className="sr-only">Escolher imagens</span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              multiple
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-[#FFB800] file:text-black
                hover:file:bg-[#E5A600]
                disabled:opacity-50"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Adicione até {maxImages} imagens. Primeira imagem sera a principal.
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-semibold">Especificacoes das imagens:</p>
        <ul className="list-disc list-inside ml-2">
          <li>Tamanho maximo: 2MB por imagem</li>
          <li>Formatos: JPG, PNG, WEBP</li>
          <li>Dimensao recomendada: 800x800 pixels</li>
          <li>Arraste para reorganizar</li>
        </ul>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {uploading && (
        <p className="text-sm text-[#FFB800]">Enviando imagens...</p>
      )}
    </div>
  )
}