import Link from 'next/link'
import Image from 'next/image'
import { 
  Shield, 
  MapPin, 
  Store, 
  Users, 
  Mail, 
  Phone, 
  MapPinned
} from 'lucide-react'
import { FaInstagram, FaYoutube } from 'react-icons/fa'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
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
              Esteja pronto para qualquer situação com EDC, BOB ou BOLT.
            </p>
            <div className="flex gap-3 mt-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500 transition-colors text-xl"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500 transition-colors text-xl"
                aria-label="YouTube"
              >
                <FaYoutube />
              </a>
            </div>
          </div>

          {/* Coluna 2 - Links Rápidos */}
          <div>
            <h3 className="text-white font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-yellow-500 transition-colors flex items-center gap-2">
                  <span>🏠</span> Dashboard
                </Link>
              </li>
              <li>
                <Link href="/loja" className="hover:text-yellow-500 transition-colors flex items-center gap-2">
                  <Store className="h-4 w-4" /> Loja
                </Link>
              </li>
              <li>
                <Link href="/catastrofes" className="hover:text-yellow-500 transition-colors flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Catástrofes
                </Link>
              </li>
              <li>
                <Link href="/guia" className="hover:text-yellow-500 transition-colors flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Guia de Preparação
                </Link>
              </li>
              <li>
                <Link href="/parceiro" className="hover:text-yellow-500 transition-colors flex items-center gap-2">
                  <Users className="h-4 w-4" /> Seja um Parceiro
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Suporte */}
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

          {/* Coluna 4 - Contato */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>devaldo.nas@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>(11) 9 1234-5678</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPinned className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>São Paulo, SP - Brasil</span>
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
            Feito para quem se prepara
          </p>
        </div>

      </div>
    </footer>
  )
}
