'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Image from 'next/image'

interface Orientacao {
  id: string
  titulo: string
  descricao: string
  orientacao: string
}

export default function PrimeirosSocorrosPage() {
  const orientacoes: Orientacao[] = [
    {
      id: 'introducao',
      titulo: 'O que são Primeiros Socorros',
      descricao: 'Cuidados iniciais prestados a uma pessoa ferida ou que passou mal, antes da chegada do atendimento especializado.',
      orientacao: 'Mantenha a calma, proteja a cena, acione o socorro e siga as orientações do atendente.'
    },
    {
      id: 'avaliacao',
      titulo: 'Como Avaliar a Situação',
      descricao: 'Antes de tocar na vítima, observe o local para garantir sua própria segurança.',
      orientacao: 'Verifique se o local é seguro, se a vítima responde, se respira e se há sangramentos graves.'
    },
    {
      id: 'queimaduras',
      titulo: 'Queimaduras',
      descricao: 'Lesões na pele causadas por calor, eletricidade, produtos químicos ou frio extremo.',
      orientacao: 'Afaste a fonte de calor, irrigue com água corrente em queimaduras leves, não fure bolhas e não use receitas caseiras.'
    },
    {
      id: 'hemorragia',
      titulo: 'Hemorragia',
      descricao: 'Perda súbita de sangue causada pelo rompimento de vasos sanguíneos.',
      orientacao: 'Faça compressão direta com gaze ou pano limpo, não remova a compressa encharcada, acione socorro se o sangramento for intenso.'
    },
    {
      id: 'amputacao',
      titulo: 'Amputação Traumática',
      descricao: 'Perda total ou parcial de uma parte do corpo causada por acidente.',
      orientacao: 'Acione socorro imediatamente, faça compressão no coto, preserve a parte amputada envolta em gaze e mantenha resfriada indiretamente.'
    },
    {
      id: 'sangramento-nasal',
      titulo: 'Sangramento Nasal',
      descricao: 'Saída de sangue pelo nariz, que pode assustar mas muitas vezes é controlável.',
      orientacao: 'Sente a pessoa, incline a cabeça levemente para frente, comprima a narina sangrante por 5 minutos e aplique compressa fria.'
    },
    {
      id: 'fraturas',
      titulo: 'Fraturas',
      descricao: 'Interrupção da continuidade óssea, podendo ser fechada ou exposta.',
      orientacao: 'Peça para a vítima não se mexer, não tente realinhar o osso, cubra ferimentos abertos com pano limpo e acione socorro.'
    },
    {
      id: 'luxacoes',
      titulo: 'Luxações',
      descricao: 'Deslocamento repentino de um ou mais ossos de uma articulação.',
      orientacao: 'Não tente colocar o osso no lugar, mantenha a articulação na posição encontrada, aplique compressa fria e procure atendimento.'
    },
    {
      id: 'entorse',
      titulo: 'Entorse',
      descricao: 'Torção de uma articulação com lesão de ligamento, comum em tornozelo e joelho.',
      orientacao: 'Pare a atividade, evite apoiar o membro, aplique compressa fria, eleve o membro e procure avaliação se houver dor intensa.'
    },
    {
      id: 'desmaio',
      titulo: 'Desmaio',
      descricao: 'Perda temporária da consciência por queda da circulação de sangue para o cérebro.',
      orientacao: 'Verifique a segurança do local, observe a respiração, afrouxe roupas apertadas, não dê líquidos se estiver inconsciente.'
    },
    {
      id: 'convulsao',
      titulo: 'Crise Convulsiva',
      descricao: 'Contração desordenada da musculatura com perda de consciência.',
      orientacao: 'Afaste objetos perigosos, proteja a cabeça, não segure a vítima com força, não coloque nada na boca, observe a duração.'
    },
    {
      id: 'erros',
      titulo: 'O Que Nunca Fazer',
      descricao: 'Atitudes que podem piorar a situação da vítima em uma emergência.',
      orientacao: 'Nunca realinhe fraturas, nunca coloque nada na boca durante convulsão, nunca use receitas caseiras em queimaduras, nunca movimente vítima de trauma grave.'
    },
    {
      id: 'kit',
      titulo: 'Kit Familiar de Primeiros Socorros',
      descricao: 'Kit básico com itens essenciais para atender emergências em casa.',
      orientacao: 'Tenha luvas, gaze, ataduras, esparadrapo, curativos, soro fisiológico, tesoura, compressas frias e uma lista de contatos de emergência.'
    },
    {
      id: 'plano',
      titulo: 'Plano Familiar de Emergência',
      descricao: 'Organização da família para agir de forma coordenada em situações de emergência.',
      orientacao: 'Defina quem liga para o socorro, quem busca o kit, mantenha contatos visíveis, crie fichas de saúde e faça simulações regulares.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6"
        >
          <ArrowLeft size={20} />
          Voltar ao Dashboard
        </Link>

        {/* Header com imagem */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 mb-4">
              <img 
                src="/images/primeiros-socorros.jpeg" 
                alt="Primeiros Socorros" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Primeiros Socorros</h1>
          </div>
        </div>

        {/* Orientações - SEM ÍCONES */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          
          <div className="space-y-3">
            {orientacoes.map((item, index) => (
              <div 
                key={item.id}
                className="p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-[#FFB800] bg-[#FFB800]/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.titulo}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.descricao}</p>
                    <p className="text-xs text-[#FFB800] mt-1 font-medium">
                      {item.orientacao}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action - Adquirir E-book */}
        <div className="bg-gradient-to-r from-[#FFB800]/10 to-[#E5A600]/10 border border-[#FFB800]/20 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Acesse o e-book completo com orientações detalhadas, checklists práticos e muito mais.
          </p>
          <Link
            href="/loja/produto/30"
            className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-bold px-6 py-2.5 rounded-lg transition inline-flex items-center gap-2"
          >
            <BookOpen size={18} />
            Adquirir E-book
          </Link>
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Este conteúdo tem finalidade educativa. Não substitui atendimento médico profissional.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            SAMU: 192 | Corpo de Bombeiros: 193
          </p>
        </div>
      </div>
    </div>
  )
}