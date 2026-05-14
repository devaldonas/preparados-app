'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Catastrofes() {
  const [abaAtiva, setAbaAtiva] = useState('terremoto')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">🌊 PREPARAÇÃO PARA CATÁSTROFES</h1>
          <p className="text-gray-600">
            Conhecimento salva vidas. Esteja preparado para qualquer situação.
          </p>
        </div>

        {/* Abas de navegação */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setAbaAtiva('terremoto')}
            className={`flex-1 py-3 text-center font-semibold transition ${
              abaAtiva === 'terremoto'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            🌍 Terremoto
          </button>
          <button
            onClick={() => setAbaAtiva('tsunami')}
            className={`flex-1 py-3 text-center font-semibold transition ${
              abaAtiva === 'tsunami'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            🌊 Tsunami
          </button>
          <button
            onClick={() => setAbaAtiva('rotas')}
            className={`flex-1 py-3 text-center font-semibold transition ${
              abaAtiva === 'rotas'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-gray-500 hover:text-green-600'
            }`}
          >
            🗺️ Rotas de Fuga
          </button>
        </div>

        {/* Conteúdo - TERREMOTO */}
        {abaAtiva === 'terremoto' && (
          <div className="space-y-6">
            {/* O que é */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">🔍 O que é um Terremoto?</h2>
              <p className="text-gray-700 leading-relaxed">
                Terremotos, também conhecidos como abalos sísmicos, são vibrações repentinas e intensas na crosta terrestre. 
                Podem ser causados pelo movimento de placas tectônicas, atividades vulcânicas ou falhas geológicas.
                A energia liberada se propaga em ondas sísmicas, que podem causar grandes danos humanos e materiais.
              </p>
              <p className="text-gray-700 mt-3">
                <strong className="text-red-600">⚠️ Importante:</strong> Um terremoto pode acontecer a qualquer momento, sem aviso prévio.
              </p>
            </div>

            {/* Escala Richter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">📊 Escala Richter</h2>
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

            {/* Onde ocorrem */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">📍 Onde os terremotos são mais comuns?</h2>
              <p className="text-gray-700 mb-3">
                São mais frequentes em regiões próximas aos limites das placas tectônicas.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Círculo de Fogo do Pacífico:</strong> região ao redor do Oceano Pacífico com intensa atividade vulcânica e sísmica</li>
                <li><strong>Zonas de rift:</strong> onde as placas tectônicas estão se separando</li>
              </ul>
              <p className="text-gray-700 mt-3 bg-yellow-50 p-3 rounded-lg">
                ⚠️ <strong>Importante:</strong> Embora a maioria ocorra nessas regiões, terremotos podem acontecer em qualquer lugar do mundo. 
                Por isso, é crucial estar preparado, independentemente de onde você mora.
              </p>
            </div>

            {/* O que fazer DURANTE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-green-700 mb-3">🚨 O que fazer DURANTE um terremoto</h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900">📌 Mantenha a calma</h3>
                  <p className="text-gray-700 mt-1">É importante manter a calma para tomar decisões racionais.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">🏠 Se estiver em local fechado:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Procure abrigo sob um móvel sólido (mesa ou escrivaninha)</li>
                    <li>Afaste-se de janelas, espelhos, quadros e prateleiras</li>
                    <li>Se não houver abrigo, sente-se no chão encostado em uma parede interna</li>
                    <li className="text-red-600 font-medium">Não saia correndo para fora durante o tremor forte</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">🌳 Se estiver em local aberto:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Afaste-se de edifícios, postes, árvores, letreiros e telhas</li>
                    <li>Procure um local aberto e abaixo-se no chão</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">🚗 Se estiver em um veículo:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Pare o carro em local seguro, longe de pontes e edifícios</li>
                    <li>Permaneça dentro do veículo até o tremor cessar</li>
                    <li>Cuidado com deslizamento de terra que pode obstruir a estrada</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Medidas Imediatas */}
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
        )}

        {/* Conteúdo - TSUNAMI */}
        {abaAtiva === 'tsunami' && (
          <div className="space-y-6">
            {/* O que é */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">🌊 O que é um Tsunami?</h2>
              <p className="text-gray-700 leading-relaxed">
                Tsunamis são ondas gigantescas e perigosas que avançam para terra adentro depois de um terremoto. 
                Se o terremoto ocorrer perto do mar, poderá ocorrer um tsunami, mesmo que o tremor seja fraco.
              </p>
            </div>

            {/* Causas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">🔍 Causas Principais dos Tsunamis</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Terremotos submarinos:</strong> A causa mais comum de tsunamis</li>
                <li><strong>Erupções vulcânicas:</strong> Erupções submarinas explosivas ou colapso de vulcão</li>
                <li><strong>Deslizamentos de terra submarinos:</strong> Podem impulsionar a água</li>
                <li><strong>Impactos de meteoritos:</strong> Extremamente raro, mas possível</li>
              </ul>
            </div>

            {/* Sinais de Alerta */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-red-600 mb-3">🚨 Sinais de Alerta ANTES de um Tsunami</h2>
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

            {/* Características */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">📏 Características dos Tsunamis</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Comprimento de onda:</strong> Extremamente longos (centenas de quilômetros)</li>
                <li><strong>Velocidade:</strong> Até 800 km/h (comparável a um avião a jato)</li>
                <li><strong>Altura em mar aberto:</strong> Poucos centímetros ou metros (difícil detectar)</li>
                <li><strong>Amplificação na costa:</strong> A onda pode atingir até 30 metros (prédio de 10 andares)</li>
                <li><strong>Duração:</strong> Pode durar mais de 8 horas com múltiplas ondas</li>
              </ul>
            </div>

            {/* O que fazer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-green-700 mb-3">✅ O que fazer ao perceber os sinais</h2>
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

            {/* Se estiver no mar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-blue-700 mb-3">⛵ Se você estiver no mar</h2>
              <p className="text-gray-700">
                Vá para o mar aberto! Virar o barco em direção às ondas e se afastar o máximo possível do litoral 
                é a melhor opção em caso de tsunami.
              </p>
            </div>
          </div>
        )}

        {/* Conteúdo - ROTAS DE FUGA */}
{abaAtiva === 'rotas' && (
  <div className="space-y-6">
    {/* Introdução */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3">🗺️ Planejamento de Rotas de Fuga</h2>
      <p className="text-gray-700 leading-relaxed">
        Em situações de emergência, ter uma rota de fuga bem planejada pode ser crucial para sua segurança 
        e a segurança dos seus entes queridos.
      </p>
    </div>

    {/* Seção: Pontos de Alagamento */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-blue-600 mb-3">💧 Pontos de Alagamento</h3>
      <p className="text-gray-700 mb-3">Identifique possíveis pontos de alagamento na sua cidade/rota, como baixadas e laterais de córregos ou rios.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <img src="/images/catastrofes/alagamento-slide1.png" alt="Alagamento 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/alagamento-slide2.png" alt="Alagamento 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/alagamento-slide3.png" alt="Alagamento 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
      </div>
    </div>

    {/* Seção: Árvores que podem cair */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-green-600 mb-3">🌳 Árvores Grandes</h3>
      <p className="text-gray-700 mb-3">Identifique árvores grandes que possam cair e obstruir a via.</p>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <img src="/images/catastrofes/arvores-slide1.png" alt="Árvores 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/arvores-slide2.png" alt="Árvores 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
      </div>
    </div>

    {/* Seção: Desmoronamento de terra */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-orange-600 mb-3">⛰️ Desmoronamento de Terra</h3>
      <p className="text-gray-700 mb-3">Cuidado com estradas em morros altos onde pode haver desmoronamento de terra.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <img src="/images/catastrofes/desmoronamento-slide1.png" alt="Desmoronamento 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/desmoronamento-slide2.png" alt="Desmoronamento 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/desmoronamento-slide3.png" alt="Desmoronamento 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
      </div>
    </div>

    {/* Seção: Pontes e Viadutos */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-red-600 mb-3">🌉 Pontes e Viadutos</h3>
      <p className="text-gray-700 mb-3">Evite pontes suspensas e viadutos durante a fuga.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <img src="/images/catastrofes/pontes-slide1.png" alt="Pontes 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/pontes-slide2.png" alt="Pontes 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/pontes-slide3.png" alt="Pontes 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/pontes-slide4.png" alt="Pontes 4" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
      </div>
    </div>

    {/* Seção: Prédios Altos e Antenas */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-purple-600 mb-3">🏢 Prédios Altos e Antenas</h3>
      <p className="text-gray-700 mb-3">Prédios altos e antenas também podem obstruir sua passagem ou cair.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <img src="/images/catastrofes/predios-slide1.png" alt="Prédios 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/predios-slide2.png" alt="Prédios 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/predios-slide3.png" alt="Prédios 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
      </div>
    </div>

    {/* Seção: Rotas de Fuga */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-green-700 mb-3">🗺️ Exemplos de Rotas de Fuga</h3>
      <p className="text-gray-700 mb-3">Trace sua rota com antecedência e evite os pontos de risco.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <img src="/images/catastrofes/rotas-slide1.png" alt="Rotas 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/rotas-slide2.png" alt="Rotas 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
        <img src="/images/catastrofes/rotas-slide3.png" alt="Rotas 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" />
      </div>
    </div>

    {/* Dicas Estratégicas */}
    <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
      <h3 className="text-lg font-bold text-yellow-800 mb-3">💡 Dicas Estratégicas</h3>
      <ul className="list-disc list-inside text-yellow-800 space-y-2">
        <li>Se possível, trace rotas em estradas com poucos ou nenhum guard rail</li>
        <li>Tenha uma chave para retirar guard rails em caso de engarrafamento</li>
        <li>Assim você conseguirá seguir nos dois sentidos se necessário</li>
      </ul>
    </div>

    {/* Plano de Ação Familiar */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">👨‍👩‍👧‍👦 Plano de Ação Familiar</h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-gray-900">📌 Organização Familiar</h4>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            <li>Definir previamente um ponto de encontro com a família</li>
            <li>Manter cópia dos documentos pessoais (físico ou digital) em embalagem à prova d'água</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900">📞 Comunicação Alternativa</h4>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            <li>Estabelecer canal alternativo com familiares (apps de emergência, rádio comunitário)</li>
            <li>Anotar contatos de emergência em papel (não só no celular)</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900">🏥 Cuidados com a Saúde</h4>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            <li>Levar medicamentos de uso contínuo</li>
            <li>Manter itens de higiene pessoal</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Mensagem final */}
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 text-center">
      <p className="text-green-800 font-semibold">
        🎯 Revise periodicamente seu plano de emergência familiar.<br/>
        Participe de treinamentos e simulações. Faça APH básico.
      </p>
    </div>
  </div>
)}

        {/* Botão Voltar */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}