export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
        <p className="text-gray-700">Ao usar o PREPARADO, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
        <p className="text-gray-700">O PREPARADO é uma plataforma de preparação para emergências que oferece:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Guia de preparação para catástrofes</li>
          <li>Mapa de rotas de fuga e pontos de apoio</li>
          <li>Check-in em áreas de risco</li>
          <li>Loja com equipamentos de preparação</li>
          <li>Comunicação via rádio PTT (Push-to-Talk)</li>
          <li>Mentorias e conteúdo educativo</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Conta do Usuário</h2>
        <p className="text-gray-700">Você é responsável por:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Manter sua senha segura</li>
          <li>Fornecer informações precisas no cadastro</li>
          <li>Não compartilhar sua conta com terceiros</li>
          <li>Notificar imediatamente sobre uso não autorizado</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Pagamentos e Assinaturas</h2>
        <p className="text-gray-700">Os pagamentos são processados pelo Mercado Pago. Ao realizar uma compra ou assinatura, você concorda com os termos do Mercado Pago.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Conduta do Usuário</h2>
        <p className="text-gray-700">Você concorda em não:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Usar o serviço para fins ilegais</li>
          <li>Compartilhar informações falsas ou enganosas</li>
          <li>Interferir no funcionamento do serviço</li>
          <li>Assediar ou prejudicar outros usuários</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Isenção de Responsabilidade</h2>
        <p className="text-gray-700">O PREPARADO é uma ferramenta de auxílio, não substitui orientação de autoridades ou profissionais de emergência. As informações são fornecidas "como estão" e podem conter imprecisões.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Modificações</h2>
        <p className="text-gray-700">Podemos atualizar estes Termos a qualquer momento. As alterações serão notificadas e entrarão em vigor após 7 dias.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Contato</h2>
        <p className="text-gray-700">Para dúvidas sobre estes Termos: <strong>devaldo.nas@gmail.com</strong></p>
      </section>
    </div>
  )
}
