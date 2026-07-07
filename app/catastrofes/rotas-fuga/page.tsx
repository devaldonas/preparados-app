// app/catastrofes/rotas-de-fuga/page.tsx
'use client'

import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'


export default function RotasFuga() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">      
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
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
            {/* Introdução */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Planejamento de Rotas de Fuga</h2>
              <p className="text-gray-700 leading-relaxed">
                Em situações de emergência, ter uma rota de fuga bem planejada pode ser crucial para sua segurança
                e a segurança dos seus entes queridos.
              </p>
            </div>

            {/* Pontos de Alagamento */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-black-600 mb-3"> Pontos de Alagamento</h3>
              <p className="text-gray-700 mb-3">Identifique possíveis pontos de alagamento na sua cidade/rota, como baixadas e laterais de córregos ou rios.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <img src="/images/catastrofes/alagamento-slide1.png" alt="Alagamento 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/alagamento-slide2.png" alt="Alagamento 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/alagamento-slide3.png" alt="Alagamento 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>

            {/* Desmoronamento de Terra */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-black-600 mb-3"> Desmoronamento de Terra</h3>
              <p className="text-gray-700 mb-3">Cuidado com estradas em morros altos onde pode haver desmoronamento de terra.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <img src="/images/catastrofes/desmoronamento-slide1.png" alt="Desmoronamento 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/desmoronamento-slide2.png" alt="Desmoronamento 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/desmoronamento-slide3.png" alt="Desmoronamento 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>

            {/* Pontes e Viadutos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-black-600 mb-3"> Pontes e Viadutos</h3>
              <p className="text-gray-700 mb-3">Evite pontes suspensas e viadutos durante a fuga.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <img src="/images/catastrofes/pontes-slide1.png" alt="Pontes 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/pontes-slide2.png" alt="Pontes 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/pontes-slide3.png" alt="Pontes 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/pontes-slide4.png" alt="Pontes 4" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>

            {/* Prédios Altos e Antenas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-black-600 mb-3"> Prédios Altos e Antenas</h3>
              <p className="text-gray-700 mb-3">Prédios altos e antenas também podem obstruir sua passagem ou cair.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <img src="/images/catastrofes/predios-slide1.png" alt="Prédios 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/predios-slide2.png" alt="Prédios 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/predios-slide3.png" alt="Prédios 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>

            {/* Exemplos de Rotas de Fuga */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3"> Exemplos de Rotas de Fuga</h3>
              <p className="text-gray-700 mb-3">Trace sua rota com antecedência e evite os pontos de risco.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <img src="/images/catastrofes/rotas-slide1.png" alt="Rotas 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/rotas-slide2.png" alt="Rotas 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/rotas-slide3.png" alt="Rotas 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>

            {/* Recursos Valiosos na Rota */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-black-600 mb-3"> Recursos Valiosos na Rota</h3>
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

            {/* Dicas Estratégicas */}
            <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-3"> Dicas Estratégicas</h3>
              <ul className="list-disc list-inside text-yellow-800 space-y-2">
                <li>Se possível, trace rotas em estradas com poucos ou nenhum guard rail</li>
                <li>Tenha uma chave para retirar guard rails em caso de engarrafamento</li>
                <li>Assim você conseguirá seguir nos dois sentidos se necessário</li>
              </ul>
            </div>

            {/* Mapear Fontes de Água */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-black-600 mb-3"> Mapear Fontes de Água</h3>
              <p className="text-gray-700 mb-3">Mapear fontes de água na sua região também é uma estratégia inteligente, pois é um recurso indispensável que pouca gente armazena.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <img src="/images/catastrofes/fontesdeagua-slide1.png" alt="Fontes de Água 1" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/fontesdeagua-slide2.png" alt="Fontes de Água 2" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <img src="/images/catastrofes/fontesdeagua-slide3.png" alt="Fontes de Água 3" className="rounded-lg w-full h-auto object-cover border border-gray-200" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            </div>

            {/* Plano de Ação em Situações de Emergência */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3"> Plano de Ação em Situações de Emergência</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2"> Organização Familiar</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Definir previamente um ponto de encontro com a família</li>
                    <li>Manter cópia dos documentos pessoais (físico ou digital) em embalagem à prova d'água</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-black-700 mb-2"> Passos Subsequentes</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Informar-se sobre rotas de evacuação e abrigos disponíveis</li>
                    <li>Seguir orientações da Defesa Civil, Corpo de Bombeiros</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-black-700 mb-2"> Kit de Emergência</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Água potável e alimentos não perecíveis</li>
                    <li>Lanterna, pilhas, rádio portátil</li>
                    <li>Kit de primeiros socorros, máscara, álcool em gel</li>
                    <li>Roupas extras</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-black-700 mb-2"> Comunicação Alternativa</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Mensagens de texto, aplicativos de emergência, rádio comunitário</li>
                    <li>Anotar contatos de emergência em papel (não só no celular)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-black-700 mb-2"> Cuidados com a Saúde</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Levar medicamentos de uso contínuo</li>
                    <li>Manter itens de higiene pessoal</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-black-700 mb-2"> Retorno à Residência</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                    <li>Somente retornar após liberação oficial das autoridades</li>
                    <li>Verificar integridade da estrutura do imóvel</li>
                    <li>Checar registros de água, gás e energia antes de utilizar</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Citações */}
            <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl p-6 border border-gray-100 text-center">
              <p className="text-gray-800 font-semibold text-lg">
                "Seja mestre de si mesmo e busquem conhecimentos."
              </p>
              
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl p-6 border border-gray-100 text-center">
              <p className="text-gray-800 font-semibold">
                Revise periodicamente seu plano de emergência familiar.<br/>
                Participe de treinamentos e simulações. Faça APH básico.
              </p>
            </div>

            {/* Botões */}
            <div className="mt-8 space-y-3">
              <BotaoIndicarAmigo />
              
              <Link
                href="/catastrofes"
                className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                ← Voltar para Catástrofes
              </Link>
              
              <Link
                href="/dashboard"
                className="block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                ← Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}