// app/parceiro/ajuda/page.tsx
'use client'

import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { ArrowLeft, HelpCircle, Mail, MessageCircle, BookOpen, FileText } from 'lucide-react'

export default function PartnerAjuda() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <NavBar showBackButton={true} backButtonPath="/parceiro/dashboard" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/parceiro/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central de Ajuda</h1>
            <p className="text-sm text-gray-500">Tire suas dúvidas sobre o programa de parceiros</p>
          </div>
        </div>

        <div className="grid gap-4">
          {/* FAQ */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-blue-600" />
              </div>
              <h2 className="font-display font-bold text-gray-900">Perguntas Frequentes</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900">Como funciona o programa de parceiros?</p>
                <p className="text-gray-600 mt-1">
                  Você pode vender seus produtos na nossa loja e ganhar comissões sobre cada venda.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Quanto ganho por venda?</p>
                <p className="text-gray-600 mt-1">
                  A comissão padrão é de 15% sobre o valor do produto. Você pode definir seu próprio preço.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Como recebo minhas comissões?</p>
                <p className="text-gray-600 mt-1">
                  As comissões são pagas mensalmente via PIX ou transferência bancária.
                </p>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageCircle size={20} className="text-green-600" />
              </div>
              <h2 className="font-display font-bold text-gray-900">Contato</h2>
            </div>
            <div className="space-y-3">
              <Link
                href="mailto:parceiros@preparado.com"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <Mail size={18} className="text-gray-500" />
                <span className="text-sm text-gray-700">parceiros@preparado.com</span>
              </Link>
              <Link
                href="https://wa.me/5511999999999"
                target="_blank"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <MessageCircle size={18} className="text-gray-500" />
                <span className="text-sm text-gray-700">WhatsApp: (11) 99999-9999</span>
              </Link>
            </div>
          </div>

          {/* Documentação */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-purple-600" />
              </div>
              <h2 className="font-display font-bold text-gray-900">Documentação</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Termos e condições do programa</p>
              <p>• Guia de boas práticas para parceiros</p>
              <p>• Política de comissões e pagamentos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}