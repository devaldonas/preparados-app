'use client'

import { useState } from 'react'

interface GaleriaProdutoProps {
  images: string[]
  productName: string
}

export default function GaleriaProduto({ images, productName }: GaleriaProdutoProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center">
        <span className="text-gray-400">Sem imagem</span>
      </div>
    )
  }

  const mainImage = images[selectedImage]
  const hasMultiple = images.length > 1

  return (
    <>
      <div className="space-y-3">
        {/* Imagem principal */}
        <div 
          className="relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setModalOpen(true)}
        >
          <img 
            src={mainImage}
            alt={productName}
            className="w-full h-80 object-contain p-4 group-hover:scale-105 transition duration-300"
          />
          
          {/* Indicador de multiplas imagens */}
          {hasMultiple && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {selectedImage + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Miniaturas (apenas se tiver mais de 1 imagem) */}
        {hasMultiple && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === index 
                    ? 'border-[#FFB800]' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img 
                  src={img}
                  alt={`${productName} - imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal para visualizar em tela cheia */}
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>
            
            <img 
              src={mainImage}
              alt={productName}
              className="w-full h-auto max-h-[80vh] object-contain"
            />

            {/* Indicador no modal */}
            {hasMultiple && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {selectedImage + 1} de {images.length}
              </div>
            )}

            {/* Navegacao no modal */}
            {hasMultiple && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center text-white text-2xl"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center text-white text-2xl"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}