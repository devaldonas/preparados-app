import Link from 'next/link'
import Image from 'next/image'
import { 
  Shield, 
  Mail, 
  MapPin,
  Globe
} from 'lucide-react'
import { FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Coluna 1 - Sobre */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image 
                src="/logo2.svg" 
                alt="PREPARADO" 
                width={32} 
                height={32} 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-white">PREPARADO</span>
            </div>
            <p className="text-sm leading-relaxed">
              Sua plataforma completa para preparação em emergências. 
            </p>
          </div>

          {/* Coluna 2 - Suporte */}
          <div>
            <h3 className="text-white font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/termos" className="hover:text-yellow-500 transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-yellow-500 transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Contato */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>contato@preparado.eco.br</span>
              </li>
              <li className="flex items-start gap-3">
                <FaWhatsapp className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>(67) 99670-1851</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Campo Grande - MS</span>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <a 
                    href="https://sol.eco.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-yellow-500 transition-colors"
                  >
                    sol.eco.br
                  </a>
                  <span className="text-xs text-gray-500">SOL - StudioOnLine</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaInstagram className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <a 
                  href="https://www.instagram.com/eae_preparado/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-yellow-500 transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FaYoutube className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <a 
                  href="https://youtube.com/@preparadopreparado" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-yellow-500 transition-colors"
                >
                  YouTube
                </a>
              </li>
            </ul>
            
            {/* Badge de segurança */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-gray-400">Dados protegidos com criptografia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>
            © {currentYear} <span className="text-white font-semibold">PREPARADO</span>. 
            Todos os direitos reservados.
          </p>
          <p className="text-gray-500">
            Venha se preparar com a gente...
          </p>
        </div>

      </div>
    </footer>
  )
}
