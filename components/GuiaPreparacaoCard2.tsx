'use client'

import { useState } from 'react'

export default function GuiaPreparacaoCard() {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header do card - estilo Dashboard */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFB800] bg-opacity-10 rounded-lg flex items-center justify-center">
            <img 
              src="/images/mochila-icon.png" 
              alt="Guia" 
              className="w-6 h-6 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Guia de Preparação da Mochila</h3>
            <p className="text-sm text-gray-500">Dicas e orientações para montar sua mochila</p>
          </div>
        </div>
      </div>

      {/* Conteúdo do guia */}
      <div className="p-5 space-y-6">
        {/* 🔥 PILARES DA PREPARAÇÃO - Adicionado aqui */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <img src="/images/logo.jpeg" alt="Defesa" className="w-5 h-5 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            Pilares da Preparação
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-white rounded-lg p-2 text-center">
              <img src="/images/defesa.jpeg" alt="Defesa" className="w-8 h-8 mx-auto mb-1 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <p className="font-bold text-gray-900 text-xs">Defesa</p>
              <p className="text-[0.55rem] text-gray-500">Atitude mental</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <img src="/images/agua.jpeg" alt="Água" className="w-8 h-8 mx-auto mb-1 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <p className="font-bold text-gray-900 text-xs">Água</p>
              <p className="text-[0.55rem] text-gray-500">Hidratação</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <img src="/images/abrigo.jpeg" alt="Abrigo" className="w-8 h-8 mx-auto mb-1 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <p className="font-bold text-gray-900 text-xs">Abrigo</p>
              <p className="text-[0.55rem] text-gray-500">Proteção</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <img src="/images/alimento.jpeg" alt="Alimento" className="w-8 h-8 mx-auto mb-1 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <p className="font-bold text-gray-900 text-xs">Alimento</p>
              <p className="text-[0.55rem] text-gray-500">Energia</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <img src="/images/fogo.jpeg" alt="Fogo" className="w-8 h-8 mx-auto mb-1 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <p className="font-bold text-gray-900 text-xs">Fogo</p>
              <p className="text-[0.55rem] text-gray-500">Calor e preparo</p>
            </div>
          </div>
          <p className="text-[0.6rem] text-center text-gray-400 mt-2">
            A Defesa é o primeiro pilar: esteja mentalmente preparado para qualquer situação.
          </p>
        </div>

        {/* Citação */}
        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#FFB800]">
          <p className="text-gray-700 text-sm italic font-medium">
            "Não é possível treinar a técnica física para todas as situações da sua vida, 
            mas é possível treinar o estado mental para todas as situações. 
            A maior arma de todas é a mente humana."
          </p>
          <p className="text-gray-500 text-xs mt-2">— Escola de Guerreiros</p>
        </div>

        {/* Como escolher sua mochila */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-[#FFB800]">▸</span> Como escolher sua mochila
          </h4>
          <p className="text-sm text-gray-600">
            Não existe mochila ideal que sirva para todo tipo de aventura. A escolha depende 
            do seu objetivo, tempo de deslocamento e necessidades específicas.
          </p>
        </div>

        {/* Características da mochila */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-green-600">✅</span> Características da mochila
          </h4>
          <p className="text-sm text-gray-600">
            De preferência por mochilas que tenham as alças largas com regulagem de altura e 
            almofadadas em todos os pontos de contato com o corpo, resistentes ou à prova d'água 
            com cinto abdominal. O cinto abdominal também é de suma importância já que por sua vez 
            ajuda na distribuição do peso...
          </p>
        </div>

        {/* Cuidados importantes */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span> Cuidados importantes
          </h4>
          <p className="text-sm text-gray-600">
            Jamais carregue a mochila em um só ombro mesmo que seja apenas por um período curto de tempo, 
            isso gera um estresse desnecessário junto ao corpo...
          </p>
        </div>

        {/* Distribuição do peso */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-blue-600">⚖️</span> Distribuição do peso
          </h4>
          <p className="text-sm text-gray-600">
            Lembrando: menos peso = deslocamento mais rápido, mais peso = deslocamento mais longe. 
            A distribuição do peso de maneira uniforme é muito importante...
          </p>
        </div>

        {/* Peso ideal */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2">Peso ideal da mochila</h4>
          <p className="text-sm text-gray-600 mb-2">
            O ideal é que as alças da mochila fiquem com o mesmo ajuste de carga nos ombros.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-sm"><span className="font-semibold">Mulheres:</span> até 10% do peso corporal</p>
            <p className="text-sm"><span className="font-semibold">Homens:</span> até 15% do peso corporal</p>
          </div>
        </div>

        {/* Organização dos bolsos */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2">Organização dos bolsos (fácil acesso)</h4>
          <p className="text-sm text-gray-600 mb-2">
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

        {/* Kits de Preparação - Subseção dentro do card */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-lg">🎒</span> Kits de Preparação
          </h4>
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
          </div>
        </div>
      </div>
    </div>
  )
}
