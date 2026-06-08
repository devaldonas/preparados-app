'use client'

import { useState } from 'react'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

export default function GuiaPreparacao() {
  const [kitsAbertos, setKitsAbertos] = useState<Record<string, boolean>>({
    documentos: false,
    agua: false,
    abrigo: false,
    fogo: false,
    primeirosSocorros: false,
    higiene: false,
    tecnologia: false,
    alimentacao: false,
    roupas: false,
    limpeza: false,
    pesca: false,
    costura: false,
    variavel: false,
  })

  const toggleKit = (kit: string) => {
    setKitsAbertos(prev => ({ ...prev, [kit]: !prev[kit] }))
  }

  const kits = [
    { id: 'documentos', nome: 'Kit Documentos', icone: '/images/documentos.jpeg', conteudo: [
      'Saco à prova d água',
      'Dinheiro físico (cédulas pequenas, prata)',
      'Mapa da sua região',
      'Original ou cópia de todos os seus documentos',
      'Documentos dos seus dependentes',
      'Cópias em pendrive'
    ] },
    { id: 'agua', nome: 'Kit Água', icone: '/images/agua.jpeg', conteudo: [
      'Garrafa de água ou cantil (inox ou alumínio)',
      'Filtro de purificação',
      'Clorin, água sanitária ou iodo'
    ] },
    { id: 'abrigo', nome: 'Kit Abrigo', icone: '/images/abrigo.jpeg', conteudo: [
      'Cobertor de alumínio',
      'Capa de chuva ou poncho',
      'Lona grossa',
      'Barraca',
      'Colchonete',
      'Rede armadeira'
    ] },
    { id: 'fogo', nome: 'Kit Fogo', icone: '/images/fogo.jpeg', conteudo: [
      'Fogareiro e gás',
      'Pederneira',
      'Isqueiro comum ou maçarico',
      'Algodão na vaselina',
      'Iniciador ou álcool',
      'Iscas de fogo'
    ] },
    { id: 'primeirosSocorros', nome: 'Kit Primeiros Socorros', icone: '/images/socorro.jpeg', conteudo: [
      'Remédios de uso contínuo',
      'Par de luvas',
      'Torniquete',
      'Traqueia',
      'Bandagem elástica',
      'Termômetro',
      'Toalhas de álcool',
      'Pinça',
      'Cortador',
      'Chás para resfriado',
      'Fio de sutura',
      'Lâmina de bisturi',
      'Colírio',
      'Tesoura sem ponta',
      'Repelente',
      'Protetor solar',
      'Esparadrapo',
      'Bandagem',
      'Gases',
      'Band-aid',
      'Algodão',
      'Pomada antisséptica',
      'Spray para dor muscular',
      'Analgésico dor muscular',
      'Cotonetes',
      'Toalhas moeda',
      'Absorventes',
      'Analgésico',
      'Dorflex',
      'Paracetamol',
      'Carvão ativado',
      'Pastilhas para garganta',
      'Hidraplex',
      'Fenaflan adesivo',
      'Hidratante labial',
      'Benegrip',
      'Spray anti-séptico',
      'Álcool gel',
      'Soro fisiológico',
      'Pomada Minâncora',
      'Iodo',
      'Alivium'
    ] },
    { id: 'higiene', nome: 'Kit Higiene', icone: '/images/higiene.jpeg', conteudo: [
      'Papel higiênico',
      'Lenços umedecidos',
      'Lenços de papel',
      'Cortador de unha',
      'Barbeador',
      'Pinça',
      'Alicate de cotícula',
      'Sabonete bactericida',
      'Creme dental (sem flúor)',
      'Escova pequena',
      'Cotonete',
      'Talco',
      'Pomada Minâncora',
      'Protetor solar',
      'Repelente'
    ] },
    { id: 'tecnologia', nome: 'Kit Tecnologia', icone: '/images/tecnologia.jpeg', conteudo: [
      'Celular com carregadores',
      'Fones de ouvido',
      'Rádio comunicador',
      'Powerbank solar',
      'Lanterna de cabeça',
      'Lanterna a pilha',
      'Pilhas extras'
    ] },
    { id: 'alimentacao', nome: 'Kit Alimentação', icone: '/images/alimento.jpeg', conteudo: [
      'Caneca, faca, colher, garfo',
      'Água e comida (Tsampa)',
      'Café, sal, mel',
      'Enlatados'
    ] },
    { id: 'roupas', nome: 'Kit Roupas', icone: '/images/roupas.jpeg', conteudo: [
      'Três pares de mudas de roupa completo',
      'Jaqueta à prova d água',
      'Camisa térmica',
      'Bota para trilha'
    ] },
    { id: 'limpeza', nome: 'Kit Limpeza', icone: '/images/equipamentos.jpeg', conteudo: [
      'Flanela branca',
      'Flanela escura',
      'Escova',
      'Cordão passador',
      'Óleo'
    ] },
    { id: 'pesca', nome: 'Kit Pesca', icone: '/images/equipamentos.jpeg', conteudo: [
      'Anzóis',
      'Chumbada',
      'Linha',
      'Boia',
      'Isca',
      'Empate',
      'Rede'
    ] },
    { id: 'costura', nome: 'Kit Costura', icone: '/images/equipamentos.jpeg', conteudo: [
      '2 botões',
      '2 agulhas',
      '1 carretel de linha',
      '2 joaninhas'
    ] },
    { id: 'variavel', nome: 'Kit Variável', icone: '/images/equipamentos.jpeg', conteudo: [
      'Bússola',
      'Faca lâmina integral',
      'Canivete',
      'Mosquetão',
      'Paracord',
      'Afiador de faca',
      'Cintas plásticas',
      'Fita isolante',
      'Apito',
      'Boné',
      'Binóculo',
      'Lanterna de cabeça',
      'Lanterna a pilha',
      'Pilhas extras',
      'Sacos BGS impermeável',
      'Caneta e bloco para anotações',
      'Sinalizador laser',
      'Velas'
    ] },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
  
                    <div className="flex items-center gap-3">
            <img 
              src="/images/mochila-icon.png" 
              alt="Guia" 
              className="h-12 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <h1 className="text-2xl font-bold text-black">Guia de Preparação da Mochila</h1>
          </div>
          <p className="text-gray-500 text-sm mt-2">Dicas e orientações para montar sua mochila de emergência</p>
        </div>

        {/* Conteúdo do guia */}
        <div className="space-y-6">
          {/* Citação */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-[#FFB800]">
            <p className="text-gray-700 text-sm italic font-medium">
              "Não é possível treinar a técnica física para todas as situações da sua vida, 
              mas é possível treinar o estado mental para todas as situações. 
              A maior arma de todas é a mente humana."
            </p>
            <p className="text-gray-500 text-xs mt-2">— Escola de Guerreiros</p>
          </div>

          {/* Como escolher sua mochila */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-[#FFB800]">▸</span> Como escolher sua mochila
            </h2>
            <p className="text-sm text-gray-600">
              Não existe mochila ideal que sirva para todo tipo de aventura. A escolha depende 
              do seu objetivo, tempo de deslocamento e necessidades específicas.
            </p>
          </div>

          {/* Características da mochila */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-[#FFB800]">▸</span> Características da mochila
            </h2>
            <p className="text-sm text-gray-600">
              De preferência por mochilas que tenham as alças largas com regulagem de altura e 
              almofadadas em todos os pontos de contato com o corpo, resistentes ou à prova d'água 
              com cinto abdominal. O cinto abdominal também é de suma importância já que por sua vez 
              ajuda na distribuição do peso...
            </p>
          </div>

          {/* Cuidados importantes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-yellow-600">▸</span> Cuidados importantes
            </h2>
            <p className="text-sm text-gray-600">
              Jamais carregue a mochila em um só ombro mesmo que seja apenas por um período curto de tempo, 
              isso gera um estresse desnecessário junto ao corpo...
            </p>
          </div>

          {/* Distribuição do peso */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-[#FFB800]">▸</span> Distribuição do peso
            </h2>
            <p className="text-sm text-gray-600">
              Lembrando: menos peso = deslocamento mais rápido, mais peso = deslocamento mais longe. 
              A distribuição do peso de maneira uniforme é muito importante...
            </p>
          </div>

          {/* Peso ideal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-2">
            <span className="text-[#FFB800]">▸</span> Peso ideal da mochila</h2>
            <p className="text-sm text-gray-600 mb-2">
              O ideal é que as alças da mochila fiquem com o mesmo ajuste de carga nos ombros.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm"><span className="font-semibold">Mulheres:</span> até 10% do peso corporal</p>
              <p className="text-sm"><span className="font-semibold">Homens:</span> até 15% do peso corporal</p>
            </div>
          </div>

          {/* Organização dos bolsos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-2">
            <span className="text-[#FFB800]">▸</span> Organização dos bolsos (fácil acesso)</h2>
            <p className="text-sm text-gray-600 mb-3">
              Na preparação da mochila, nos bolsos de fácil acesso deve se deixar tudo que poderá 
              ou não ser usado frequentemente, como:
            </p>
            <div className="flex flex-wrap gap-2">
              {['Kit primeiros socorros', 'Garrafa de água', 'Material de pesca', 'Bloco para anotação', 
                'Caneta', 'Faca', 'Isqueiro', 'Lanterna'].map((item) => (
                <span key={item} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Kits de Preparação */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg"></span> Kits de Preparação
            </h2>
            <div className="space-y-3">
              {kits.map((kit) => (
                <div key={kit.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <button 
                    onClick={() => toggleKit(kit.id)} 
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={kit.icone} 
                        alt={kit.nome} 
                        className="w-5 h-5 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <span className="font-semibold text-gray-900 text-sm">{kit.nome}</span>
                    </div>
                    <span className="text-gray-500 text-sm">{kitsAbertos[kit.id] ? '▲' : '▼'}</span>
                  </button>
                  {kitsAbertos[kit.id] && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
                        {kit.conteudo.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

          {/* Botao Voltar para Minhas Mochilas */}
          <div className="mb-6">
            <Link
              href="/mochilas"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <span className="text-lg">←</span>
              <span>Voltar para Minhas Mochilas</span>
            </Link>
          </div>

               {/* Header com botão voltar */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span>←</span> Voltar ao Início
          </Link>

          {/* Botao Indicar Amigo */}
                  <div className="mb-6">
                    <BotaoIndicarAmigo />
                  </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}