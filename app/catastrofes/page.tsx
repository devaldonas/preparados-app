'use client'

import Link from 'next/link'
import { useState } from 'react'
import FooterCarousel from '@/components/CarouselFooter'

interface CardCatastrofe {
  id: string
  nome: string
  descricao: string
  icone: string
  cor: string
}

export default function Catastrofes() {
  const [cardSelecionado, setCardSelecionado] = useState<string | null>(null)

  const cards: CardCatastrofe[] = [
    {
      id: 'terremoto',
      nome: 'Terremoto',
      descricao: 'Saiba como agir durante e após um terremoto',
      icone: '/images/catastrofes/terremoto.jpeg',
      cor: 'from-White-500 to-red-700'
    },
    {
      id: 'tsunami',
      nome: 'Tsunami',
      descricao: 'Identifique sinais e saiba como se proteger',
      icone: '/images/catastrofes/tsunami.jpeg',
      cor: 'from-White-500 to-blue-700'
    },
    {
      id: 'rotas',
      nome: 'Rotas de Fuga',
      descricao: 'Planeje sua rota de evacuação com antecedência',
      icone: '/images/catastrofes/rotadefuga.png',
      cor: 'from-White-500 to-green-700'
    },
    {
      id: 'frio',
      nome: 'Frio Extremo',
      descricao: 'Prepare-se para temperaturas extremamente baixas',
      icone: '/images/catastrofes/frioextremo.jpeg',
      cor: 'from-White-500 to-cyan-700'
    }
  ]

  // Card de Terremoto
  if (cardSelecionado === 'terremoto') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
       
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-8">
            
            <button
              onClick={() => setCardSelecionado(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <span className="text-lg">←</span>
              <span>Voltar para Calamidaes</span>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img 
                src="/images/catastrofes/terremoto.jpeg" 
                alt="Terremoto" 
                className="w-16 h-16 object-contain rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Terremoto</h1>
                <p className="text-gray-500">Saiba como agir durante e após um terremoto</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">O que é um Terremoto?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Terremotos, também conhecidos como abalos sísmicos, são vibrações repentinas e intensas na crosta terrestre.
                  Podem ser causados pelo movimento de placas tectônicas, atividades vulcânicas ou falhas geológicas.
                  A energia liberada se propaga em ondas sísmicas, que podem causar grandes danos humanos e materiais.
                </p>
                <p className="text-gray-700 mt-3">
                  <strong className="text-red-600">⚠️ Importante:</strong> Um terremoto pode acontecer a qualquer momento, sem aviso prévio.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Escala Richter</h2>
                <p className="text-gray-700 mb-4">
                  Criada por Charles Richter há cerca de 70 anos, mede a potência de um tremor em uma escala de 1 a 9.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Magnitude</th>
                        <th className="p-2 text-left">Efeitos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr><td className="p-2 font-medium">2,0 a 3,4</td><td className="p-2">Imperceptível</td></tr>
                      <tr><td className="p-2 font-medium">3,5 a 4,2</td><td className="p-2">Ouve-se o barulho do tremor</td></tr>
                      <tr><td className="p-2 font-medium">4,3 a 4,9</td><td className="p-2">Balança móveis e pode quebrar pequenos objetos</td></tr>
                      <tr><td className="p-2 font-medium">5,0 a 5,9</td><td className="p-2">Desloca objetos pesados e racha muros</td></tr>
                      <tr><td className="p-2 font-medium">6,0 a 6,9</td><td className="p-2">Danos consideráveis a edifícios</td></tr>
                      <tr><td className="p-2 font-medium">7,0 a 7,3</td><td className="p-2">Danos graves a edifícios e quebra de encanamentos</td></tr>
                      <tr><td className="p-2 font-medium">7,4 a 7,9</td><td className="p-2">Graves danos, destruição de prédios</td></tr>
                      <tr><td className="p-2 font-medium text-red-600">acima de 8,0</td><td className="p-2 text-red-600">Destruição completa</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Onde os terremotos são mais comuns?</h2>
                <p className="text-gray-700 mb-3">São mais frequentes em regiões próximas aos limites das placas tectônicas.</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Círculo de Fogo do Pacífico:</strong> região ao redor do Oceano Pacífico com intensa atividade vulcânica e sísmica</li>
                  <li><strong>Zonas de rift:</strong> onde as placas tectônicas estão se separando</li>
                </ul>
                <p className="text-gray-700 mt-3 bg-yellow-50 p-3 rounded-lg">
                  ⚠️ <strong>Importante:</strong> Embora a maioria ocorra nessas regiões, terremotos podem acontecer em qualquer lugar do mundo.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">O que fazer DURANTE um terremoto</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900">Mantenha a calma</h3>
                    <p className="text-gray-700 mt-1">É importante manter a calma para tomar decisões racionais.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Se estiver em local fechado:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Procure abrigo sob um móvel sólido (mesa ou escrivaninha)</li>
                      <li>Afaste-se de janelas, espelhos, quadros e prateleiras</li>
                      <li>Se não houver abrigo, sente-se no chão encostado em uma parede interna</li>
                      <li className="text-red-600 font-medium">Não saia correndo para fora durante o tremor forte</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Se estiver em local aberto:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Afaste-se de edifícios, postes, árvores, letreiros e telhas</li>
                      <li>Procure um local aberto e abaixo-se no chão</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Se estiver em um veículo:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Pare o carro em local seguro, longe de pontes e edifícios</li>
                      <li>Permaneça dentro do veículo até o tremor cessar</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">⚠️ Medidas Imediatas APÓS o tremor</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Buscar informações nos canais oficiais de segurança da localidade</li>
                  <li>Fechar os registros de água e gás</li>
                  <li>Em caso de vazamento de gás: abrir portas e janelas para ventilação</li>
                  <li>Não acender fósforos, isqueiros ou acionar interruptores elétricos</li>
                  <li>Evitar o uso de elevadores</li>
                  <li>Dirigir-se a um local aberto e seguro</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Card de Tsunami
  if (cardSelecionado === 'tsunami') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-8">
            
            <button
              onClick={() => setCardSelecionado(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <span className="text-lg">←</span>
              <span>Voltar para Calamidades</span>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img 
                src="/images/catastrofes/tsunami.jpeg" 
                alt="Tsunami" 
                className="w-16 h-16 object-contain rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tsunami</h1>
                <p className="text-gray-500">Identifique sinais e saiba como se proteger</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">O que é um Tsunami?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Tsunamis são ondas gigantescas e perigosas que avançam para terra adentro depois de um terremoto.
                  Se o terremoto ocorrer perto do mar, poderá ocorrer um tsunami, mesmo que o tremor seja fraco.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Causas Principais dos Tsunamis</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Terremotos submarinos:</strong> A causa mais comum de tsunamis</li>
                  <li><strong>Erupções vulcânicas:</strong> Erupções submarinas explosivas ou colapso de vulcão</li>
                  <li><strong>Deslizamentos de terra submarinos:</strong> Podem impulsionar a água</li>
                  <li><strong>Impactos de meteoritos:</strong> Extremamente raro, mas possível</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-red-600 mb-3">Sinais de Alerta ANTES de um Tsunami</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-bold text-gray-900">1. Tremores intensos</h3>
                    <p className="text-gray-700">Se sentir um terremoto forte, afaste-se imediatamente da praia.</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-bold text-gray-900">2. Recuo repentino do mar</h3>
                    <p className="text-gray-700">O mar pode se afastar de forma anormal, deixando o fundo exposto. Esse é um dos sinais mais claros!</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-bold text-gray-900">3. Ondas incomuns</h3>
                    <p className="text-gray-700">Ondas fora do padrão, mais fortes ou em intervalos irregulares.</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-bold text-gray-900">4. Barulho forte do mar</h3>
                    <p className="text-gray-700">Sons semelhantes a trovões, rugidos ou barulho de um trem.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Características dos Tsunamis</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Comprimento de onda:</strong> Extremamente longos (centenas de quilômetros)</li>
                  <li><strong>Velocidade:</strong> Até 800 km/h (comparável a um avião a jato)</li>
                  <li><strong>Altura em mar aberto:</strong> Poucos centímetros ou metros (difícil detectar)</li>
                  <li><strong>Amplificação na costa:</strong> A onda pode atingir até 30 metros (prédio de 10 andares)</li>
                  <li><strong>Duração:</strong> Pode durar mais de 8 horas com múltiplas ondas</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">O que fazer ao perceber os sinais</h2>
                <div className="space-y-3">
                  <p className="text-gray-700 bg-red-50 p-3 rounded-lg font-medium">
                    ⚠️ Não espere os avisos oficiais para agir!
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Quanto mais alto e mais longe do litoral, mais seguro você estará</li>
                    <li>Alguns tsunamis podem avançar até 16 km continente adentro</li>
                    <li>Vá para o alto de um prédio resistente (suba o mais alto possível, idealmente o terraço)</li>
                    <li>Caso não consiga sair da zona de perigo a tempo, procure o prédio mais alto</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Se você estiver no mar</h2>
                <p className="text-gray-700">
                  Vá para o mar aberto! Virar o barco em direção às ondas e se afastar o máximo possível do litoral
                  é a melhor opção em caso de tsunami.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Card de Rotas de Fuga
  if (cardSelecionado === 'rotas') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-8">
            
            <button
              onClick={() => setCardSelecionado(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <span className="text-lg">←</span>
              <span>Voltar para Calamidades</span>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img 
                src="/images/catastrofes/rotadefuga.png" 
                alt="Rotas de Fuga" 
                className="w-16 h-16 object-contain rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rotas de Fuga</h1>
                <p className="text-gray-500">Planeje sua rota de evacuação com antecedência</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Planejamento de Rotas de Fuga</h2>
                <p className="text-gray-700 leading-relaxed">
                  Em situações de emergência, ter uma rota de fuga bem planejada pode ser crucial para sua segurança
                  e a segurança dos seus entes queridos.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-600 mb-3">Pontos de Alagamento</h3>
                <p className="text-gray-700 mb-3">Identifique possíveis pontos de alagamento na sua cidade/rota, como baixadas e laterais de córregos ou rios.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <img src="/images/catastrofes/alagamento-slide1.png" alt="Alagamento 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/alagamento-slide2.png" alt="Alagamento 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/alagamento-slide3.png" alt="Alagamento 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-orange-600 mb-3">Desmoronamento de Terra</h3>
                <p className="text-gray-700 mb-3">Cuidado com estradas em morros altos onde pode haver desmoronamento de terra.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <img src="/images/catastrofes/desmoronamento-slide1.png" alt="Desmoronamento 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/desmoronamento-slide2.png" alt="Desmoronamento 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/desmoronamento-slide3.png" alt="Desmoronamento 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-red-600 mb-3">Pontes e Viadutos</h3>
                <p className="text-gray-700 mb-3">Evite pontes suspensas e viadutos durante a fuga.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <img src="/images/catastrofes/pontes-slide1.png" alt="Pontes 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/pontes-slide2.png" alt="Pontes 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/pontes-slide3.png" alt="Pontes 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/pontes-slide4.png" alt="Pontes 4" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-purple-600 mb-3">Prédios Altos e Antenas</h3>
                <p className="text-gray-700 mb-3">Prédios altos e antenas também podem obstruir sua passagem ou cair.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <img src="/images/catastrofes/predios-slide1.png" alt="Prédios 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/predios-slide2.png" alt="Prédios 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/predios-slide3.png" alt="Prédios 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Exemplos de Rotas de Fuga</h3>
                <p className="text-gray-700 mb-3">Trace sua rota com antecedência e evite os pontos de risco.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <img src="/images/catastrofes/rotas-slide1.png" alt="Rotas 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/rotas-slide2.png" alt="Rotas 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/rotas-slide3.png" alt="Rotas 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-purple-600 mb-3">Recursos Valiosos na Rota</h3>
                <p className="text-gray-700 mb-3">Mesmo em deslocamento na rota de fuga, você ainda pode adquirir recursos valiosos.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <img src="/images/catastrofes/recursos-slide1.png" alt="Recursos 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/recursos-slide2.png" alt="Recursos 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/recursos-slide3.png" alt="Recursos 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <ul className="list-disc list-inside text-gray-600 mt-3 text-sm">
                  <li><strong>Farmácias</strong> - Medicamentos e primeiros socorros</li>
                  <li><strong>Mercados</strong> - Alimentos e água</li>
                  <li><strong>Postos de combustível</strong> - Combustível e suprimentos</li>
                </ul>
              </div>

              <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                <h3 className="text-lg font-bold text-yellow-800 mb-3">Dicas Estratégicas</h3>
                <ul className="list-disc list-inside text-yellow-800 space-y-2">
                  <li>Se possível, trace rotas em estradas com poucos ou nenhum guard rail</li>
                  <li>Tenha uma chave para retirar guard rails em caso de engarrafamento</li>
                  <li>Assim você conseguirá seguir nos dois sentidos se necessário</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-600 mb-3">Mapear Fontes de Água</h3>
                <p className="text-gray-700 mb-3">Mapear fontes de água na sua região também é uma estratégia inteligente, pois é um recurso indispensável que pouca gente armazena.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  <img src="/images/catastrofes/fontesdeagua-slide1.png" alt="Fontes de Água 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/fontesdeagua-slide2.png" alt="Fontes de Água 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/fontesdeagua-slide3.png" alt="Fontes de Água 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Plano de Ação em Situações de Emergência</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Organização Familiar</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Definir previamente um ponto de encontro com a família</li>
                      <li>Manter cópia dos documentos pessoais (físico ou digital) em embalagem à prova d'água</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-700 mb-2">Passos Subsequentes</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Informar-se sobre rotas de evacuação e abrigos disponíveis</li>
                      <li>Seguir orientações da Defesa Civil, Corpo de Bombeiros</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-700 mb-2">Kit de Emergência</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Água potável e alimentos não perecíveis</li>
                      <li>Lanterna, pilhas, rádio portátil</li>
                      <li>Kit de primeiros socorros, máscara, álcool em gel</li>
                      <li>Roupas extras</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-700 mb-2">Comunicação Alternativa</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Mensagens de texto, aplicativos de emergência, rádio comunitário</li>
                      <li>Anotar contatos de emergência em papel (não só no celular)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-red-700 mb-2">Cuidados com a Saúde</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Levar medicamentos de uso contínuo</li>
                      <li>Manter itens de higiene pessoal</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-700 mb-2">Retorno à Residência</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Somente retornar após liberação oficial das autoridades</li>
                      <li>Verificar integridade da estrutura do imóvel</li>
                      <li>Checar registros de água, gás e energia antes de utilizar</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl p-6 border border-gray-100 text-center">
                <p className="text-gray-800 font-semibold text-lg">
                  "Seja mestre de si mesmo e busquem conhecimentos."
                </p>
                <p className="text-gray-600 text-sm mt-2">Escola de Guerreiros</p>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl p-6 border border-gray-100 text-center">
                <p className="text-gray-800 font-semibold">
                  Revise periodicamente seu plano de emergência familiar.<br/>
                  Participe de treinamentos e simulações. Faça APH básico.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    )
  }

  // Card de Frio Extremo
  if (cardSelecionado === 'frio') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-8">
            
            <button
              onClick={() => setCardSelecionado(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <span className="text-lg">←</span>
              <span>Voltar para Calamidades</span>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <img 
                src="/images/catastrofes/frioextremo.jpeg" 
                alt="Frio Extremo" 
                className="w-16 h-16 object-contain rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Preparação para Frio Extremo</h1>
                <p className="text-gray-500">Prepare-se para temperaturas extremamente baixas</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-blue-700 mb-3">Sistema de Camadas</h2>
                <img src="/images/catastrofes/camadas-slide1.png" alt="Sistema de Camadas" className="rounded-lg w-full h-auto mb-4 border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <p className="text-gray-700">É o sistema usado por moradores de regiões frias, alpinistas e pessoas em expedições em locais de frio extremo.</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-2">Primeira Camada (Roupa Térmica)</h3>
                <p className="text-gray-700">Gerenciamento de umidade, absorção e dissipação de suor. Minimiza a perda de calor por indução. A maioria das roupas térmicas é sintática, extremamente leve. Sua principal função é manter o corpo aquecido e seco.</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-2">Segunda Camada (Gerenciamento Térmico)</h3>
                <p className="text-gray-700">Deve se vestir por cima das roupas térmicas, fortalecendo a primeira camada, isolando mais a temperatura do corpo. Função: reter o calor do corpo. Pode ser de fibras naturais (lã grossa) ou artificiais (fleece - poliéster de fibra sintética).</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-2">Terceira Camada (Camada Exterior)</h3>
                <p className="text-gray-700">Jaqueta e calça. Age como isolante. Deve ser totalmente impermeável, respirável, à prova de vento, neve e chuva, mantendo as demais camadas secas.</p>
                <img src="/images/catastrofes/preparadoparaofrio-slide1.png" alt="Preparação para o Frio" className="rounded-lg w-full h-auto mt-4 border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-red-600 mb-2">⚠️ Atenção às Extremidades</h3>
                <p className="text-gray-700 mb-3">Por onde perdemos mais calor. O sangue vai para o centro do corpo para preservar os órgãos vitais, deixando mãos, pés, nariz e orelhas com menos circulação, mais propícios a queimaduras e, em casos extremos, necrose.</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>Meias térmicas com absorção de suor, respirabilidade e secagem rápida</li>
                  <li>Bota com solado grosso, resistente, antiderrapante, com forro térmico e à prova d'água</li>
                  <li>Balaclava e gorro, gola térmica e manta de pescoço</li>
                  <li>Luvas com proteção térmica, resistentes à água e vento</li>
                  <li>Óculos de sol espelhado para evitar cegueira da neve</li>
                  <li>⚠️ Nada de metal diretamente ligado à pele (o metal gruda)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Controle Térmico</h3>
                <p className="text-yellow-800">Atenção ao gerenciamento do controle térmico. Suor em excesso resfria o corpo rapidamente. Na neve, se você suar muito, você morre. Ex: num deslocamento, devido ao esforço o corpo aquece; se aquece demais, produz suor; se suar, depois é difícil se aquecer.</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-2">Hipotermia</h3>
                <p className="text-gray-700 mb-3"><strong>O que é:</strong> Quando a temperatura do corpo cai abaixo de 35°C. O organismo precisa estar entre 36°C e 37,5°C para realizar suas funções metabólicas.</p>
                <p className="text-gray-700 mb-3"><strong>Causas:</strong> Longo período exposto ao frio intenso. O corpo humano libera mais calor do que consegue reter. Corpo molhado ou exposto ao vento perde calor 25 vezes mais rápido.</p>
                <p className="text-gray-700 mb-3"><strong>Sintomas:</strong> Tremores (fricção para aquecer o corpo), mãos e pés dormentes, cansaço, lentidão, dificuldade no falar, frequência cardíaca diminuída, dificuldade em respirar, perda de controle dos membros, perda de consciência, parada cardíaca.</p>
                <p className="text-gray-700"><strong>Tratamento:</strong> Aquecer o organismo imediatamente, progressivamente, principalmente as extremidades, aquecendo de dentro para fora com bebidas quentes. Cobrir a pessoa com mantas térmicas e cobertores, ficar perto do calor.</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-2">Isolantes Térmicos - Use sua criatividade</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <img src="/images/catastrofes/isolantes-slide1.png" alt="Isolante 1" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/isolantes-slide2.png" alt="Isolante 2" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/isolantes-slide3.png" alt="Isolante 3" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/isolantes-slide4.png" alt="Isolante 4" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/isolantes-slide5.png" alt="Isolante 5" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/isolantes-slide6.png" alt="Isolante 6" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/isolantes-slide7.png" alt="Isolante 7" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/isolantes-slide8.png" alt="Isolante 8" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Cobertores grossos, saco de dormir</li>
                  <li>Roupas para pets, mantas térmicas para telhado</li>
                  <li>Papel, papelão, caixas de leite</li>
                  <li>Placas de isopor, placas de lã</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-2">Casa vs Apartamento - Preparação para Frio Extremo</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 text-lg mb-3">Quem mora em CASA</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Reforçar portas e grades nas janelas</li>
                      <li>Tratar a casa como se fosse nosso castelo, nosso refúgio</li>
                      <li>Instalar fogão a lenha ou lareira</li>
                      <li>Guardar lenha (é mais fácil do que em apartamento)</li>
                      <li>Aumentar o muro para maior segurança</li>
                      <li>Consegue armazenar melhor: lenha, botijões de gás, reservatório de água</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 text-lg mb-3">Quem mora em APARTAMENTO</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Apartamento tem um pouco mais de segurança</li>
                      <li>Mais pontos de estrangulamento (escadas, elevador)</li>
                      <li>Pode bloquear as escadas ou trancar o elevador</li>
                      <li>Levar a ideia para discussão nas reuniões do condomínio</li>
                      <li>Sugestão: instalar fogões a lenha (é só um buraco na parede para o cano)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Alimentos e Hidratação</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <img src="/images/catastrofes/alimentos-slide1.png" alt="Alimento" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/alimentos-slide2.png" alt="Alimento" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/alimentos-slide3.png" alt="Alimento" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/alimentos-slide4.png" alt="Alimento" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/alimentos-slide5.png" alt="Alimento" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Sopas e caldos (além de aquecer, tem valor psicológico)</li>
                  <li>Temperos secos: cebola, salsa, alho</li>
                  <li>Chocolate quente, chás, café, canela, vitamina D</li>
                  <li>Evitar bebidas alcoólicas (inibem a termorregulação)</li>
                  <li>Cuidado com desidratação (frio atenua a sede)</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-2">🚶 Deslocamento no Frio</h3>
                <img src="/images/catastrofes/deslocamento-frio-slide1.png" alt="Deslocamento" className="rounded-lg w-full mb-4 border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <p className="text-gray-700 mb-3">Quando você está em deslocamento, não é necessário usar camadas pesadas para se aquecer. Se você continuar se movendo e estiver minimamente isolado, produzirá calor suficiente.</p>
                <p className="text-gray-700 font-semibold">⚠️ DICA: APRENDA A FAZER UMA RAQUETE DE NEVE!</p>
                <p className="text-gray-700 mt-3"><strong>Manter a mente ativa:</strong> Jogos para crianças, exercícios em família, criar uma rotina. Proteger janelas e portas com material isolante. Tapetes e carpetes no chão, pois o chão drena muito calor.</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-red-600 mb-2">⚠️ Infraestrutura no Frio Extremo</h3>
                <p className="text-gray-700 mb-3">Nossas casas e carros não foram feitos para frios extremos. O sistema hidráulico não funciona, canos dilatam e quebram com a formação de gelo. Vasos sanitários congelam. Carros não ligam (fluidos congelam).</p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-bold text-blue-700">Armazenamento de Água</h4>
                    <img src="/images/catastrofes/agua-slide1.png" alt="Água" className="rounded-lg w-full border mb-2" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <img src="/images/catastrofes/agua-slide2.png" alt="Água" className="rounded-lg w-full border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-700">Cuidados com Gás</h4>
                    <img src="/images/catastrofes/gas-slide1.png" alt="Gás" className="rounded-lg w-full border mb-2" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <img src="/images/catastrofes/gas-slide2.png" alt="Gás" className="rounded-lg w-full border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-orange-700 mb-2">Como Cozinhar sem Gás</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <img src="/images/catastrofes/cozinhar-slide1.png" alt="Cozinhar" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/cozinhar-slide2.png" alt="Cozinhar" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  <img src="/images/catastrofes/cozinhar-slide3.png" alt="Cozinhar" className="rounded-lg border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <p className="text-gray-700">Óleo de cozinha como combustível, lata ou panela, álcool de posto.</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                <h3 className="text-lg font-bold text-blue-700 mb-2">Planejamento de Reservas</h3>
                <p className="text-gray-700">Família de 3 pessoas: aproximadamente 30 litros de água/dia. Para 6 meses: cerca de 5.400 litros.</p>
                <p className="text-gray-700 mt-2">Gás: se gasta 13kg por mês, 6 botijões são suficientes para 6 meses.</p>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl p-6 border border-gray-100 text-center">
                <p className="text-gray-800 font-semibold">Busquem conhecimento!<br />www.dakilapesquisas.com.br</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    )
  }

  // Tela inicial com os cards de catástrofes
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Preparação para Calamidades</h1>
            <p className="text-gray-500">Conhecimento salva vidas. Esteja preparado para qualquer situação.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => setCardSelecionado(card.id)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition text-center group"
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center bg-gradient-to-r ${card.cor}`}>
                  <img 
                    src={card.icone} 
                    alt={card.nome} 
                    className="w-10 h-10 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <h3 className="font-bold text-gray-900 text-base">{card.nome}</h3>
                <p className="text-xs text-gray-500 mt-1">{card.descricao}</p>
              </button>
            ))}
          </div>
        </div>
         <div className="mt-8">
                  <Link href="/dashboard" className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition">
                    Voltar à Home
                  </Link>
                </div>
      </div>
      
    </div>
  )
}