export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Informações que Coletamos</h2>
        <p className="text-gray-700 mb-2">O PREPARADO coleta as seguintes informações:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Dados de cadastro:</strong> Nome, e-mail e senha para criar sua conta</li>
          <li><strong>Dados de localização:</strong> Para exibir pontos de interesse, rotas de fuga e check-in em áreas de risco</li>
          <li><strong>Dados de uso:</strong> Como você interage com o app, incluindo páginas visitadas e funcionalidades utilizadas</li>
          <li><strong>Dados de pagamento:</strong> Processados exclusivamente pelo Mercado Pago, não armazenamos dados de cartão</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Como Usamos seus Dados</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Fornecer e manter os serviços do PREPARADO</li>
          <li>Enviar notificações sobre emergências e atualizações relevantes</li>
          <li>Melhorar a experiência do usuário e corrigir problemas</li>
          <li>Processar pagamentos via Mercado Pago</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Compartilhamento de Dados</h2>
        <p className="text-gray-700">Não vendemos nem compartilhamos seus dados pessoais com terceiros, exceto:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Mercado Pago:</strong> Para processamento de pagamentos</li>
          <li><strong>Supabase:</strong> Para armazenamento de dados em nuvem</li>
          <li><strong>Vercel:</strong> Para hospedagem da aplicação</li>
          <li><strong>Quando exigido por lei</strong> ou para proteger direitos legais</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Seus Direitos (LGPD)</h2>
        <p className="text-gray-700">Você tem direito a:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Acessar, corrigir ou excluir seus dados a qualquer momento</li>
          <li>Solicitar a portabilidade dos seus dados</li>
          <li>Revogar consentimentos a qualquer momento</li>
          <li>Solicitar informações sobre como usamos seus dados</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Segurança</h2>
        <p className="text-gray-700">Utilizamos medidas de segurança como criptografia (HTTPS), autenticação JWT e boas práticas de desenvolvimento para proteger seus dados.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Contato</h2>
        <p className="text-gray-700">Para questões sobre privacidade, entre em contato:</p>
        <p className="text-gray-700 mt-2"><strong>E-mail:</strong> devaldo.nas@gmail.com</p>
      </section>
    </div>
  )
}
