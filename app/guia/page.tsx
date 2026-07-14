'use client'

import { useState } from 'react'
import Link from 'next/link'
import BotaoIndicarAmigo from '@/components/BotaoIndicarAmigo'

interface ItemKit {
  nome: string
  descricao: string
}

interface Kit {
  id: string
  nome: string
  icone: string
  conteudo: ItemKit[]
}

export default function GuiaPreparação() {
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

  const kits: Kit[] = [
    { 
      id: 'documentos', 
      nome: 'Kit Documentos', 
      icone: '/images/documentos.jpeg', 
      conteudo: [
        { nome: 'Saco à prova d\'água', descricao: 'Protege documentos, dinheiro e pequenos eletrônicos contra chuva, umidade e respingos.' },
        { nome: 'Dinheiro físico (cédulas pequenas e moedas)', descricao: 'Permite compras e pagamentos quando cartões, internet ou energia elétrica não estiverem disponíveis.' },
        { nome: 'Mapa da sua região', descricao: 'Ajuda na orientação, na escolha de rotas alternativas e na localização de abrigos, estradas e pontos de referência.' },
        { nome: 'Original ou cópia dos documentos', descricao: 'Facilita a identificação pessoal e o acesso a serviços, transporte, hospedagem, atendimento e benefícios.' },
        { nome: 'Documentos dos dependentes', descricao: 'Comprovam a identidade e o vínculo de crianças, idosos ou outras pessoas sob sua responsabilidade.' },
        { nome: 'Cópias em pendrive', descricao: 'Funcionam como backup digital; o ideal é proteger os arquivos com senha e manter o dispositivo em embalagem impermeável.' }
      ] 
    },
    { 
      id: 'agua', 
      nome: 'Kit Água', 
      icone: '/images/agua.jpeg', 
      conteudo: [
        { nome: 'Garrafa de água ou cantil (inox ou alumínio)', descricao: 'Serve para transportar uma reserva individual de água e facilitar o controle do consumo ao longo do dia.' },
        { nome: 'Filtro de purificação', descricao: 'Reduz partículas e, conforme a especificação do equipamento, pode remover determinados microrganismos e contaminantes.' },
        { nome: 'Clorin, água sanitária ou iodo', descricao: 'Podem ser usados na desinfecção de água apenas quando o produto for apropriado para esse fim e seguindo rigorosamente o rótulo ou a orientação oficial. Nunca misture produtos químicos.' }
      ] 
    },
    { 
      id: 'abrigo', 
      nome: 'Kit Abrigo', 
      icone: '/images/abrigo.jpeg', 
      conteudo: [
        { nome: 'Cobertor de alumínio', descricao: 'Ajuda a reduzir a perda de calor corporal e também pode refletir calor, luz e vento em situações de emergência.' },
        { nome: 'Capa de chuva ou poncho', descricao: 'Mantém o corpo e parte da mochila secos, diminuindo desconforto e risco de perda de calor.' },
        { nome: 'Lona grossa', descricao: 'Pode formar um abrigo improvisado, cobertura contra chuva, proteção de equipamentos ou isolamento do solo.' },
        { nome: 'Barraca', descricao: 'Oferece proteção contra vento, chuva, insetos e exposição durante o descanso.' },
        { nome: 'Colchonete', descricao: 'Isola o corpo do solo frio ou úmido e melhora o conforto para dormir.' },
        { nome: 'Rede armadeira', descricao: 'Rede compacta de descanso que mantém o corpo afastado do chão e pode integrar um sistema de abrigo, conforme o modelo.' }
      ] 
    },
    { 
      id: 'fogo', 
      nome: 'Kit Fogo', 
      icone: '/images/fogo.jpeg', 
      conteudo: [
        { nome: 'Fogareiro e gás', descricao: 'Permitem cozinhar e aquecer água de forma controlada. Devem ser usados em local ventilado e afastado de materiais inflamáveis.' },
        { nome: 'Pederneira', descricao: 'Produz faíscas para iniciar o fogo e costuma funcionar mesmo depois de contato com umidade, quando corretamente utilizada.' },
        { nome: 'Isqueiro comum ou maçarico', descricao: 'Fornece chama rápida para acender fogareiro, vela ou material de ignição.' },
        { nome: 'Algodão com vaselina', descricao: 'Funciona como isca de fogo de queima relativamente prolongada, ajudando a transferir a chama para gravetos secos.' },
        { nome: 'Iniciador ou álcool', descricao: 'Facilita a ignição, mas exige extremo cuidado por ser inflamável. Use somente produto adequado, em pequena quantidade e longe de chamas descontroladas.' },
        { nome: 'Iscas de fogo', descricao: 'Materiais secos e de fácil combustão usados para receber a faísca ou a chama inicial.' }
      ] 
    },
    { 
      id: 'primeirosSocorros', 
      nome: 'Kit Primeiros Socorros', 
      icone: '/images/socorro.jpeg', 
      conteudo: [
        { nome: 'Remédios de uso contínuo', descricao: 'Mantêm tratamentos essenciais durante deslocamentos e interrupções de abastecimento. Leve quantidade compatível, receita quando necessária e embalagem original.' },
        { nome: 'Par de luvas', descricao: 'Protege quem presta socorro e a vítima contra contato com sangue, fluidos e secreções.' },
        { nome: 'Torniquete', descricao: 'Usado para controlar sangramentos graves em membros. Exige treinamento e deve ser aplicado apenas em situações extremas.' },
        { nome: 'Traqueia', descricao: 'Dispositivo para via aérea que exige treinamento específico. Use apenas se tiver capacitação adequada.' },
        { nome: 'Bandagem elástica', descricao: 'Mantém compressão e estabilidade em contusões, torções e imobilizações leves.' },
        { nome: 'Termômetro', descricao: 'Verifica temperatura corporal, auxiliando na identificação de febre ou hipotermia.' },
        { nome: 'Toalhas de álcool', descricao: 'Higienizam a pele antes de procedimentos ou limpeza de pequenos ferimentos.' },
        { nome: 'Pinça', descricao: 'Auxilia na remoção de farpas, ciscos ou pequenos objetos de ferimentos.' },
        { nome: 'Cortador', descricao: 'Corta curativos, esparadrapo, fita e materiais diversos com segurança.' },
        { nome: 'Chás para resfriado', descricao: 'Ajudam no alívio de sintomas leves de resfriado e proporcionam conforto térmico.' },
        { nome: 'Fio de sutura', descricao: 'Material para fechamento de ferimentos que exige treinamento. Não deve ser usado sem capacitação.' },
        { nome: 'Lâmina de bisturi', descricao: 'Ferramenta cortante para procedimentos específicos que exige treinamento e cuidado extremo.' },
        { nome: 'Colírio', descricao: 'Limpa e lubrifica os olhos em casos de irritação ou presença de corpos estranhos.' },
        { nome: 'Tesoura sem ponta', descricao: 'Corta curativos, roupas e materiais com segurança, sem risco de perfuração acidental.' },
        { nome: 'Repelente', descricao: 'Afasta insetos, reduzindo risco de picadas e doenças transmitidas por vetores.' },
        { nome: 'Protetor solar', descricao: 'Protege a pele contra raios solares, prevenindo queimaduras e danos causados pela exposição prolongada.' },
        { nome: 'Esparadrapo', descricao: 'Fixa curativos, gaze e outros materiais sobre a pele.' },
        { nome: 'Bandagem', descricao: 'Cobre e protege ferimentos, mantendo a área limpa e isolada.' },
        { nome: 'Gases', descricao: 'Almofadas de algodão para limpeza, cobertura e proteção de feridas.' },
        { nome: 'Band-aid', descricao: 'Protege pequenos cortes e arranhões, mantendo o local limpo e isolado.' },
        { nome: 'Algodão', descricao: 'Aplica medicamentos, faz limpeza suave ou protege pequenas lesões.' },
        { nome: 'Pomada antisséptica', descricao: 'Previne infecções em ferimentos leves e auxilia na cicatrização.' },
        { nome: 'Spray para dor muscular', descricao: 'Alivia dores e tensões musculares com aplicação tópica.' },
        { nome: 'Analgésico dor muscular', descricao: 'Medicamento para alívio de dores musculares e inflamações, conforme orientação médica.' },
        { nome: 'Cotonetes', descricao: 'Faz limpeza precisa em áreas pequenas e aplicação localizada de medicamentos.' },
        { nome: 'Toalhas moeda', descricao: 'Toalhas compactas que se expandem com água, úteis para limpeza pessoal.' },
        { nome: 'Absorventes', descricao: 'Controle de sangramentos e emergências ginecológicas durante o deslocamento.' },
        { nome: 'Analgésico', descricao: 'Medicamento para alívio de dores de cabeça, febre e desconfortos gerais.' },
        { nome: 'Dorflex', descricao: 'Analgésico e relaxante muscular para dores de cabeça e tensão muscular.' },
        { nome: 'Paracetamol', descricao: 'Analgésico e antitérmico para febre e dores leves a moderadas.' },
        { nome: 'Carvão ativado', descricao: 'Usado em casos de intoxicação, ajuda a absorver toxinas no sistema digestivo.' },
        { nome: 'Pastilhas para garganta', descricao: 'Aliviam irritações, inflamações e dores de garganta.' },
        { nome: 'Hidraplex', descricao: 'Repõe sais minerais e líquidos, útil em casos de desidratação ou diarreia.' },
        { nome: 'Fenaflan adesivo', descricao: 'Adesivo anti-inflamatório para alívio local de dores musculares e articulares.' },
        { nome: 'Hidratante labial', descricao: 'Protege os lábios contra ressecamento, rachaduras e exposição ao sol e vento.' },
        { nome: 'Benegrip', descricao: 'Alivia sintomas de gripe e resfriado, como febre, dor de cabeça e congestão.' },
        { nome: 'Spray anti-séptico', descricao: 'Higieniza ferimentos e superfícies, prevenindo infecções.' },
        { nome: 'Álcool gel', descricao: 'Higieniza as mãos quando não há água e sabão disponíveis.' },
        { nome: 'Soro fisiológico', descricao: 'Lava ferimentos, olhos e mucosas, mantendo a área limpa.' },
        { nome: 'Pomada Minâncora', descricao: 'Alivia coceiras, picadas de inseto e pequenas irritações da pele.' },
        { nome: 'Iodo', descricao: 'Anti-séptico para higienização de ferimentos e desinfecção de água (se apropriado).' },
        { nome: 'Alivium', descricao: 'Analgésico para dores musculares e inflamações, conforme orientação médica.' }
      ] 
    },
    { 
      id: 'higiene', 
      nome: 'Kit Higiene', 
      icone: '/images/higiene.jpeg', 
      conteudo: [
        { nome: 'Papel higiênico', descricao: 'Mantém a higiene pessoal em locais sem infraestrutura.' },
        { nome: 'Lenços umedecidos', descricao: 'Permitem limpeza rápida das mãos e do corpo quando não há água disponível.' },
        { nome: 'Lenços de papel', descricao: 'Úteis para limpeza geral, absorção e higiene básica.' },
        { nome: 'Cortador de unha', descricao: 'Mantém as unhas aparadas, prevenindo acidentes e facilitando a higiene.' },
        { nome: 'Barbeador', descricao: 'Permite manutenção da barba e higiene pessoal durante deslocamentos prolongados.' },
        { nome: 'Pinça', descricao: 'Remove farpas, ciscos ou pequenos objetos da pele.' },
        { nome: 'Alicate de cutícula', descricao: 'Ajuda na manutenção das unhas e higiene pessoal.' },
        { nome: 'Sabonete bactericida', descricao: 'Garante limpeza e higienização das mãos e do corpo, prevenindo infecções.' },
        { nome: 'Creme dental (sem flúor)', descricao: 'Mantém a higiene bucal em situações de deslocamento.' },
        { nome: 'Escova pequena', descricao: 'Ferramenta compacta para escovação dos dentes.' },
        { nome: 'Cotonete', descricao: 'Faz limpeza precisa em áreas pequenas.' },
        { nome: 'Talco', descricao: 'Ajuda a manter a pele seca, prevenindo assaduras e irritações.' },
        { nome: 'Pomada Minâncora', descricao: 'Alivia coceiras, picadas de inseto e irritações da pele.' },
        { nome: 'Protetor solar', descricao: 'Protege a pele contra raios solares durante exposição prolongada.' },
        { nome: 'Repelente', descricao: 'Afasta insetos, reduzindo risco de picadas e doenças.' }
      ] 
    },
    { 
      id: 'tecnologia', 
      nome: 'Kit Tecnologia', 
      icone: '/images/tecnologia.jpeg', 
      conteudo: [
        { nome: 'Celular com carregadores', descricao: 'Ferramenta de comunicação, informação e localização, com carregadores para manter a energia.' },
        { nome: 'Fones de ouvido', descricao: 'Permitem comunicação, entretenimento e recebimento de informações sem exposição externa.' },
        { nome: 'Rádio comunicador', descricao: 'Mantém comunicação com o grupo e recebimento de informações em áreas sem sinal de celular.' },
        { nome: 'Powerbank solar', descricao: 'Recarrega dispositivos eletrônicos usando energia solar, útil em deslocamentos prolongados.' },
        { nome: 'Lanterna de cabeça', descricao: 'Ilumina com as mãos livres, útil para deslocamento noturno e trabalhos detalhados.' },
        { nome: 'Lanterna a pilha', descricao: 'Serve como iluminação reserva independente da energia elétrica.' },
        { nome: 'Pilhas extras', descricao: 'Mantêm lanternas, rádios e outros dispositivos em funcionamento por mais tempo.' }
      ] 
    },
    { 
      id: 'alimentacao', 
      nome: 'Kit Alimentação', 
      icone: '/images/alimento.jpeg', 
      conteudo: [
        { nome: 'Caneca, faca, colher, garfo', descricao: 'Utensílios básicos para preparo e consumo de alimentos durante o deslocamento.' },
        { nome: 'Água e comida (Tsampa)', descricao: 'Alimento compacto e energético, de fácil preparo e longa durabilidade.' },
        { nome: 'Café, sal, mel', descricao: 'Itens de sabor e preservação que melhoram a alimentação em situações de emergência.' },
        { nome: 'Enlatados', descricao: 'Alimentos de longa duração, prontos para consumo ou fácil preparo.' }
      ] 
    },
    { 
      id: 'roupas', 
      nome: 'Kit Roupas', 
      icone: '/images/roupas.jpeg', 
      conteudo: [
        { nome: 'Três pares de mudas de roupa completo', descricao: 'Mantém o corpo seco e protegido em diferentes condições climáticas.' },
        { nome: 'Jaqueta à prova d\'água', descricao: 'Protege contra chuva, vento e frio, mantendo o corpo seco.' },
        { nome: 'Camisa térmica', descricao: 'Mantém o calor corporal em baixas temperaturas.' },
        { nome: 'Bota para trilha', descricao: 'Protege os pés e garante estabilidade em terrenos variados durante deslocamentos.' }
      ] 
    },
    { 
      id: 'limpeza', 
      nome: 'Kit Limpeza', 
      icone: '/images/equipamentos.jpeg', 
      conteudo: [
        { nome: 'Flanela branca', descricao: 'Ajuda na limpeza fina e permite visualizar melhor resíduos, sujeira e excesso de óleo.' },
        { nome: 'Flanela escura', descricao: 'É útil para remover graxa, fuligem e sujeira intensa sem evidenciar manchas no tecido.' },
        { nome: 'Escova', descricao: 'Solta resíduos de superfícies, ranhuras e peças de difícil acesso.' },
        { nome: 'Cordão passador', descricao: 'Conduz pano ou escova por tubos e espaços estreitos durante a limpeza de equipamentos.' },
        { nome: 'Óleo', descricao: 'Lubrifica e protege superfícies metálicas contra atrito e corrosão, desde que seja o produto recomendado pelo fabricante.' }
      ] 
    },
    { 
      id: 'pesca', 
      nome: 'Kit Pesca', 
      icone: '/images/equipamentos.jpeg', 
      conteudo: [
        { nome: 'Anzóis', descricao: 'Prendem a isca e permitem fisgar o peixe; devem ser transportados em embalagem rígida.' },
        { nome: 'Chumbada', descricao: 'Adiciona peso para levar a linha e a isca à profundidade desejada.' },
        { nome: 'Linha', descricao: 'Conecta a vara ou o suporte ao anzol e aos demais componentes.' },
        { nome: 'Boia', descricao: 'Mantém a isca em determinada profundidade e sinaliza movimentação ou mordida.' },
        { nome: 'Isca', descricao: 'Atrai o peixe, podendo ser natural ou artificial.' },
        { nome: 'Empate', descricao: 'Trecho reforçado entre a linha e o anzol, útil contra abrasão, dentes ou rompimentos.' },
        { nome: 'Rede', descricao: 'Auxilia na captura ou retirada do peixe da água. O uso deve respeitar as regras locais de pesca.' }
      ] 
    },
    { 
      id: 'costura', 
      nome: 'Kit Costura', 
      icone: '/images/equipamentos.jpeg', 
      conteudo: [
        { nome: '2 botões', descricao: 'Substituem botões perdidos em roupas, bolsas e equipamentos.' },
        { nome: '2 agulhas', descricao: 'Permitem pequenos reparos em tecidos, costuras e acessórios.' },
        { nome: '1 carretel de linha', descricao: 'Fornece material para costurar rasgos, fixar botões e fazer amarrações leves.' },
        { nome: '2 joaninhas', descricao: 'Pequenos alfinetes de segurança usados para prender provisoriamente tecidos, faixas ou peças soltas.' }
      ] 
    },
    { 
      id: 'variavel', 
      nome: 'Kit Variável', 
      icone: '/images/equipamentos.jpeg', 
      conteudo: [
        { nome: 'Bússola', descricao: 'Ajuda a determinar direção e orientação quando usada junto com um mapa e conhecimento básico de navegação.' },
        { nome: 'Faca lâmina integral', descricao: 'Ferramenta robusta para corte e tarefas gerais. Deve ser transportada com bainha, usada com segurança e respeitar a legislação local.' },
        { nome: 'Canivete', descricao: 'Ferramenta compacta para cortes leves, abertura de embalagens e pequenos reparos.' },
        { nome: 'Mosquetão', descricao: 'Organiza e prende objetos leves à mochila. Não deve ser usado para escalada ou sustentação humana sem certificação específica.' },
        { nome: 'Paracord', descricao: 'Corda resistente para amarrações, reparos, montagem de abrigo e organização de carga.' },
        { nome: 'Afiador de faca', descricao: 'Mantém a capacidade de corte das lâminas e reduz a força necessária durante o uso.' },
        { nome: 'Cintas plásticas', descricao: 'Fazem fixações rápidas, agrupam cabos e ajudam em reparos temporários.' },
        { nome: 'Fita isolante', descricao: 'Isola conexões elétricas simples e auxilia em reparos provisórios e fixações.' },
        { nome: 'Apito', descricao: 'Produz sinal sonoro forte para pedir ajuda ou indicar localização com pouco gasto de energia.' },
        { nome: 'Boné', descricao: 'Protege rosto e olhos do sol e ajuda a reduzir a incidência direta de luz.' },
        { nome: 'Binóculo', descricao: 'Permite observar rotas, obstáculos, pessoas e pontos de referência à distância.' },
        { nome: 'Lanterna de cabeça', descricao: 'Ilumina com as mãos livres, útil para deslocamento noturno e trabalhos detalhados.' },
        { nome: 'Lanterna a pilha', descricao: 'Serve como iluminação reserva independente da energia elétrica.' },
        { nome: 'Pilhas extras', descricao: 'Mantêm lanternas e rádios em funcionamento por mais tempo.' },
        { nome: 'Sacos BGS impermeáveis', descricao: 'Protegem e separam roupas, documentos, alimentos ou equipamentos da umidade.' },
        { nome: 'Caneta e bloco para anotações', descricao: 'Permitem registrar contatos, rotas, horários, recados, inventário e informações importantes.' },
        { nome: 'Sinalizador laser', descricao: 'Pode servir como sinal visual à distância, mas nunca deve ser apontado para olhos, pessoas, veículos ou aeronaves.' },
        { nome: 'Velas', descricao: 'Fornecem iluminação e uma pequena fonte de chama. Devem ficar em base firme, longe de materiais inflamáveis e nunca sem supervisão.' }
      ] 
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header com botão voltar */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span>←</span> Voltar ao Início
          </Link>

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
              <span className="text-[#FFB800]">▸</span> Peso ideal da mochila
            </h2>
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
              <span className="text-[#FFB800]">▸</span> Organização dos bolsos (fácil acesso)
            </h2>
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

          {/* Kits de Preparação - COM DESCRIÇÕES */}
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
                      <ul className="space-y-2 text-xs text-gray-600">
                        {kit.conteudo.map((item, idx) => (
                          <li key={idx} className="flex flex-col gap-0.5">
                            <span className="font-medium text-gray-800">{item.nome}</span>
                            <span className="text-gray-500 text-[11px] leading-relaxed">
                              {item.descricao}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

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

          {/* Botao Indicar Amigo */}
          <div className="mb-6">
            <BotaoIndicarAmigo />
          </div>
        </div>
      </div>
    </div>
  )
}