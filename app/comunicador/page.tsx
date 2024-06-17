'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

interface GrupoCanal {
  id: number
  nome: string
  membros: number
  uf: string
}

export default function Comunicador() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState<GrupoCanal[]>([])
  const [canalAtivo, setCanalAtivo] = useState<'grupos' | 'admin' | 'dakila'>('grupos')
  const [isOn, setIsOn] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(70)
  const [rangeKm, setRangeKm] = useState(50)
  const [svgContent, setSvgContent] = useState<string>('')
  const [modoExibicao, setModoExibicao] = useState<'ch' | 'grupo'>('grupo')
  const router = useRouter()
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const eventosConfigurados = useRef(false)
  

  // ===== FUNÇÃO REUTILIZÁVEL DE ALTERNÂNCIA =====
  const alternarRadio = () => {
    console.log(' Alternando rádio via função unificada')
    setIsOn(prev => !prev)
  }

  // ===== FUNÇÃO PARA ALTERNAR O PTT =====
  const alternarPtt = () => {
    if (!isOn) {
      console.log(' Rádio desligado, não é possível usar o PTT')
      return
    }
    console.log(' Alternando PTT para:', !isRecording ? 'ON' : 'OFF')
    setIsRecording(prev => !prev)
  }

  // ===== FUNÇÃO PARA ALTERNAR ENTRE CH E GRUPOS =====
const alternarModoExibicao = () => {
  console.log(' Alternando modo para:', modoExibicao === 'ch' ? 'grupo' : 'ch')
  setModoExibicao(prev => prev === 'ch' ? 'grupo' : 'ch')
}

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        await carregarGrupos()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  useEffect(() => {
    const carregarSVG = async () => {
      try {
        const response = await fetch('/images/comunicador/radio-interface.svg')
        const svgText = await response.text()
        setSvgContent(svgText)
        console.log('SVG carregado com sucesso!')
      } catch (error) {
        console.error('❌ Erro ao carregar SVG:', error)
        setSvgContent(`
          <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="500" fill="#1a1a1a" rx="20"/>
            <text x="200" y="250" text-anchor="middle" fill="#FFB800" font-size="20">
              Interface do Rádio
            </text>
            <text x="200" y="280" text-anchor="middle" fill="#666" font-size="14">
              Arquivo SVG não encontrado
            </text>
          </svg>
        `)
      }
    }
    carregarSVG()
  }, [])

  useEffect(() => {
    if (!loading && svgContent && !eventosConfigurados.current) {
      const timer = setTimeout(() => {
        configurarEventosSVG()
        atualizarDisplay()
        eventosConfigurados.current = true
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [loading, svgContent])

  // ===== useEffect para atualizar visibilidade do ON/OFF =====
  useEffect(() => {
    if (svgContent) {
      console.log('useEffect - isOn mudou para:', isOn)
      atualizarVisibilidadeOnOff()
    }
  }, [isOn, svgContent])

  // ===== useEffect para atualizar visibilidade do PTT =====
  useEffect(() => {
    if (svgContent) {
      console.log('useEffect - isRecording mudou para:', isRecording)
      atualizarVisibilidadePtt()
    }
  }, [isRecording, svgContent])

  // ===== useEffect para atualizar visibilidade CH/Grupos =====
useEffect(() => {
  if (svgContent) {
    console.log('🔄 useEffect - modoExibicao mudou para:', modoExibicao)
    atualizarVisibilidadeChGrupos()
  }
}, [modoExibicao, svgContent])


  const carregarGrupos = async () => {
    const { data } = await supabase
      .from('groups')
      .select('id, name, member_count')
      .gt('member_count', 0)
      .order('member_count', { ascending: false })

    if (data) {
      const ufs = ['SC', 'SP', 'MG', 'PE', 'MS']
      const gruposFormatados = data.map((g, index) => ({
        id: g.id,
        nome: g.name.toUpperCase(),
        membros: g.member_count,
        uf: ufs[index] || 'UF'
      }))
      setGrupos(gruposFormatados)
    }
  }

  // ===== 1. ATUALIZAR VISIBILIDADE ON/OFF =====
const atualizarVisibilidadeOnOff = () => {
  const container = svgContainerRef.current
  if (!container) return
  
  const svgElement = container.querySelector('svg')
  if (!svgElement) return

  const onEl = svgElement.querySelector('#botao-On-ativo') as SVGElement
  const offEl = svgElement.querySelector('#botao-Off-ativo') as SVGElement

  if (isOn) {
    if (onEl) {
      onEl.setAttribute('display', 'block')
      onEl.setAttribute('opacity', '1')
      onEl.setAttribute('visibility', 'visible')
    }
    if (offEl) {
      offEl.setAttribute('display', 'none')
      offEl.setAttribute('opacity', '0')
      offEl.setAttribute('visibility', 'hidden')
    }
  } else {
    if (offEl) {
      offEl.setAttribute('display', 'block')
      offEl.setAttribute('opacity', '1')
      offEl.setAttribute('visibility', 'visible')
    }
    if (onEl) {
      onEl.setAttribute('display', 'none')
      onEl.setAttribute('opacity', '0')
      onEl.setAttribute('visibility', 'hidden')
    }
  }
}

// ===== 2. ATUALIZAR VISIBILIDADE PTT =====
const atualizarVisibilidadePtt = () => {
  const container = svgContainerRef.current
  if (!container) return
  
  const svgElement = container.querySelector('svg')
  if (!svgElement) return

  const pttEl = svgElement.querySelector('#botao-ptt') as SVGElement

  if (pttEl) {
    if (isRecording) {
      pttEl.setAttribute('fill', '#FFB800')
      pttEl.setAttribute('stroke', '#FFB800')
      pttEl.setAttribute('filter', 'drop-shadow(0 0 15px #FFB800)')
      pttEl.setAttribute('opacity', '1')
    } else {
      pttEl.setAttribute('fill', '#666')
      pttEl.setAttribute('stroke', '#666')
      pttEl.removeAttribute('filter')
      pttEl.setAttribute('opacity', '0.8')
    }
  }
}

// ===== 3. ATUALIZAR VISIBILIDADE CH/GRUPOS (NOVA) =====
const atualizarVisibilidadeChGrupos = () => {
  const container = svgContainerRef.current
  if (!container) return
  
  const svgElement = container.querySelector('svg')
  if (!svgElement) return

  const chEl = svgElement.querySelector('#botao-ch-ativo') as SVGElement
  const grupoEl = svgElement.querySelector('#botao-grupo-ativo') as SVGElement

  console.log('Atualizando CH/Grupos - modo:', modoExibicao)

  if (modoExibicao === 'ch') {
    if (chEl) {
      chEl.setAttribute('display', 'block')
      chEl.setAttribute('opacity', '1')
      chEl.setAttribute('visibility', 'visible')
    }
    if (grupoEl) {
      grupoEl.setAttribute('display', 'none')
      grupoEl.setAttribute('opacity', '0')
      grupoEl.setAttribute('visibility', 'hidden')
    }
  } else {
    if (grupoEl) {
      grupoEl.setAttribute('display', 'block')
      grupoEl.setAttribute('opacity', '1')
      grupoEl.setAttribute('visibility', 'visible')
    }
    if (chEl) {
      chEl.setAttribute('display', 'none')
      chEl.setAttribute('opacity', '0')
      chEl.setAttribute('visibility', 'hidden')
    }
  }
}

  const configurarEventosSVG = () => {
    const container = svgContainerRef.current
    if (!container) {
      console.log('Container não encontrado')
      return
    }

    const svgElement = container.querySelector('svg')
    if (!svgElement) {
      console.log('SVG não encontrado no container')
      return
    }

    svgElement.setAttribute('id', 'radio-interface-svg')
    console.log('Configurando eventos no SVG...')

    // ===== BOTÃO ON =====
    const btnOn = svgElement.querySelector('#botao-On-ativo') as SVGElement
    
    if (btnOn) {
      btnOn.style.pointerEvents = 'auto'
      btnOn.style.cursor = 'pointer'
      btnOn.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        console.log('🔴 ON clicado - alternando via função unificada')
        alternarRadio()
      })
      console.log('✅ Botão ON configurado')
    } else {
      console.log('❌ botao-On-ativo não encontrado')
    }

    // ===== BOTÃO OFF =====
    const btnOff = svgElement.querySelector('#botao-Off-ativo') as SVGElement
    
    if (btnOff) {
      btnOff.style.pointerEvents = 'auto'
      btnOff.style.cursor = 'pointer'
      btnOff.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        console.log('🔴 OFF clicado - alternando via função unificada')
        alternarRadio()
      })
      console.log('✅ Botão OFF configurado')
    } else {
      console.log('❌ botao-Off-ativo não encontrado')
    }

    // ===== SLIDER RANGE =====
    const sliderRange = svgElement.querySelector('#slider-range') as SVGElement
    if (sliderRange) {
      sliderRange.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        setRangeKm(parseInt(target.value))
        const param = svgElement.querySelector('#parametro-slider-range')
        if (param) param.textContent = `${target.value}km`
      })
      console.log('✅ Slider Range configurado')
    }

    // ===== SLIDER VOLUME =====
    const sliderVolume = svgElement.querySelector('#slider-volume') as SVGElement
    if (sliderVolume) {
      sliderVolume.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        setVolume(parseInt(target.value))
      })
      console.log('✅ Slider Volume configurado')
    }

    // ===== SLIDER MICROFONE =====
    const sliderMicrofone = svgElement.querySelector('#slider-microfone') as SVGElement
    if (sliderMicrofone) {
      sliderMicrofone.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement
        console.log('🎤 Sensibilidade:', target.value)
      })
      console.log('✅ Slider Microfone configurado')
    }

    // ===== BOTÃO GRUPOS =====
    const btnGrupos = svgElement.querySelector('#botao-ch-grupos_-_GruposAtivo') as SVGElement
    if (btnGrupos) {
      btnGrupos.addEventListener('click', () => {
        console.log('🔄 Grupos clicado')
        const canais = ['grupos', 'admin', 'dakila']
        const index = canais.indexOf(canalAtivo)
        const proximo = canais[(index + 1) % canais.length]
        
        setCanalAtivo(proximo as any)
        atualizarDisplay()
      })
      btnGrupos.setAttribute('cursor', 'pointer')
      console.log('✅ Grupos configurado')
    }

    // ===== FUNÇÃO PARA ALTERNAR ENTRE CH E GRUPOS =====
const alternarModoExibicao = () => {
  console.log('🔄 Alternando modo para:', modoExibicao === 'ch' ? 'grupo' : 'ch')
  setModoExibicao(prev => prev === 'ch' ? 'grupo' : 'ch')
}

// ===== ATUALIZAR VISIBILIDADE CH/GRUPOS =====
const atualizarVisibilidadeChGrupos = () => {
  const container = svgContainerRef.current
  if (!container) return
  
  const svgElement = container.querySelector('svg')
  if (!svgElement) return

  const chEl = svgElement.querySelector('#botao-ch-ativo') as SVGElement
  const grupoEl = svgElement.querySelector('#botao-grupo-ativo') as SVGElement

  console.log('🔄 Atualizando CH/Grupos - modo:', modoExibicao)

  if (modoExibicao === 'ch') {
    if (chEl) {
      chEl.setAttribute('display', 'block')
      chEl.setAttribute('opacity', '1')
      chEl.setAttribute('visibility', 'visible')
    }
    if (grupoEl) {
      grupoEl.setAttribute('display', 'none')
      grupoEl.setAttribute('opacity', '0')
      grupoEl.setAttribute('visibility', 'hidden')
    }
  } else {
    if (grupoEl) {
      grupoEl.setAttribute('display', 'block')
      grupoEl.setAttribute('opacity', '1')
      grupoEl.setAttribute('visibility', 'visible')
    }
    if (chEl) {
      chEl.setAttribute('display', 'none')
      chEl.setAttribute('opacity', '0')
      chEl.setAttribute('visibility', 'hidden')
    }
  }
}



    // ===== BOTÃO MAPA =====
    const btnMapa = svgElement.querySelector('#botao-mapa-ativo') as SVGElement
    if (btnMapa) {
      btnMapa.addEventListener('click', () => {
        console.log('🗺️ Mapa clicado')
        router.push('/pessoas')
      })
      btnMapa.setAttribute('cursor', 'pointer')
      console.log('✅ Mapa configurado')
    }

    // ===== BOTÃO RADAR =====
    const btnRadar = svgElement.querySelector('#botao-radar-ativo') as SVGElement
    if (btnRadar) {
      btnRadar.addEventListener('click', () => {
        console.log('📡 Radar clicado')
      })
      btnRadar.setAttribute('cursor', 'pointer')
      console.log('✅ Radar configurado')
    }

    // ===== BOTÃO CONTROLES =====
    const btnControles = svgElement.querySelector('#botao-controles-ativo') as SVGElement
    if (btnControles) {
      btnControles.addEventListener('click', () => {
        console.log('🎛️ Controles clicado')
      })
      btnControles.setAttribute('cursor', 'pointer')
      console.log('✅ Controles configurado')
    }

    console.log('🎯 Eventos configurados!')
  }

  const atualizarDisplay = () => {
    const container = svgContainerRef.current
    if (!container) return

    const svgElement = container.querySelector('svg')
    if (!svgElement) return

    const titulo = svgElement.querySelector('#container-titulo-canal')
    if (titulo) {
      const titulos = {
        grupos: 'GRUPOS PESSOAS PRÓXIMAS',
        admin: 'ADMIN',
        dakila: 'COORDENAÇÃO DAKILA'
      }
      titulo.textContent = titulos[canalAtivo]
    }

    let containerGrupos = svgElement.querySelector('#container-grupos-canal')
    if (!containerGrupos) {
      containerGrupos = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      containerGrupos.setAttribute('id', 'container-grupos-canal')
      svgElement.appendChild(containerGrupos)
    }

    containerGrupos.innerHTML = ''

    if (canalAtivo === 'grupos') {
      let yPos = 30
      grupos.forEach(grupo => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', '20')
        text.setAttribute('y', String(yPos))
        text.setAttribute('fill', '#FFB800')
        text.setAttribute('font-size', '14')
        text.setAttribute('font-family', 'monospace')
        text.textContent = `${String(grupo.membros).padStart(2, '0')} ${grupo.nome}`
        containerGrupos.appendChild(text)
        yPos += 25
      })
    } else if (canalAtivo === 'admin') {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', '20')
      text.setAttribute('y', '30')
      text.setAttribute('fill', '#FFB800')
      text.setAttribute('font-size', '14')
      text.textContent = '05 ADMIN'
      containerGrupos.appendChild(text)
    } else {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', '20')
      text.setAttribute('y', '30')
      text.setAttribute('fill', '#FFB800')
      text.setAttribute('font-size', '14')
      text.textContent = '12 COORDENAÇÃO DAKILA'
      containerGrupos.appendChild(text)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB800]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-white text-center mb-4">Comunicador Via Rádio</h1>
        
        {/* Indicador de estado ON/OFF */}
        <div className="flex justify-between items-center mb-4 bg-gray-800 p-3 rounded-lg">
          <span className="text-white font-semibold">Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-white">{isOn ? 'Ligado' : 'Desligado'}</span>
          </div>
          <button
            onClick={alternarRadio}
            className="px-3 py-1 bg-[#FFB800] text-black rounded-lg text-sm font-semibold"
          >
            Alternar
          </button>
        </div>

        {/* Indicador de gravação */}
        {isRecording && (
          <div className="mb-4 flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            GRAVANDO
          </div>
        )}

        {/* SVG com botões invisíveis sobrepostos */}
<div className="relative">
  {/* SVG do rádio */}
  <div 
    ref={svgContainerRef}
    className="w-full"
    dangerouslySetInnerHTML={{ __html: svgContent }}
  />
  
  {/* Botão ON/OFF invisível */}
  <button
    onClick={alternarRadio}
    className="absolute opacity-0 cursor-pointer z-10"
    style={{
      top: '58%',
      left: '100%',
      width: '18%',
      height: '12%',
      transform: 'translate(-50%, -50%)',
    }}
    aria-label="Ligar/Desligar rádio"
  />

  {/* Botão PTT invisível */}
  <button
    onMouseDown={() => {
      if (isOn) {
        setIsRecording(true)
        console.log(' PTT pressionado - gravando...')
      } else {
        console.log(' Rádio desligado')
      }
    }}
    onMouseUp={() => {
      setIsRecording(false)
      console.log('🎤 PTT solto - parou de gravar')
    }}
    onMouseLeave={() => {
      if (isRecording) {
        setIsRecording(false)
        console.log('🎤 PTT cancelado - mouse saiu')
      }
    }}
    onTouchStart={() => {
      if (isOn) {
        setIsRecording(true)
        console.log('🎤 PTT pressionado (touch) - gravando...')
      }
    }}
    onTouchEnd={() => {
      setIsRecording(false)
      console.log('🎤 PTT solto (touch) - parou de gravar')
    }}
    className="absolute opacity-0 cursor-pointer z-10"
    style={{
      top: '43%',
      left: '90%',
      width: '65%',
      height: '11.20%',
      transform: 'translate(-50%, -50%)',
      touchAction: 'none',
    }}
    aria-label="Push to Talk"
  />

  {/* Botão CH/Grupos invisível */}
  <button
    onClick={alternarModoExibicao}
    className="absolute opacity-0 cursor-pointer z-10"
    style={{
    top: '58%',
    left: '69%',
    width: '22.28%',
    height: '11.82%',
      transform: 'translate(-50%, -50%)',
    }}
    aria-label="Alternar entre Canais e Grupos"
  />
</div>

<div className="mt-6">
  <Link
    href="/dashboard"
    className="block text-center bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition"
  >
    Voltar ao Início
  </Link>
  <div className="mt-4">
    <BotaoIndicarAmigo />
   </div>
        </div>
      </div>
    </div>
    
  )
}