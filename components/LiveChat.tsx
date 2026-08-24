'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Send } from 'lucide-react';

interface Mensagem {
  id: string;
  live_id: number;
  usuario_id: string;
  usuario_nome: string;
  mensagem: string;
  created_at: string;
}

interface LiveChatProps {
  liveId: number;
  isLive: boolean;
}

export default function LiveChat({ liveId, isLive }: LiveChatProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!liveId) return;

    const fetchMensagens = async () => {
      try {
        const { data, error } = await supabase
          .from('live_chat_messages')
          .select('*')
          .eq('live_id', liveId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;
        setMensagens(data || []);
        setError(null);
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        setError('Erro ao carregar mensagens');
      } finally {
        setLoading(false);
      }
    };

    fetchMensagens();

    // Polling a cada 5 segundos
    const interval = setInterval(fetchMensagens, 5000);

    return () => clearInterval(interval);
  }, [liveId]);

  // CORRIGIDO: Scroll APENAS dentro do container do chat
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Scroll apenas dentro do container do chat
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [mensagens]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novaMensagem.trim() || !user || !liveId) return;
    
    setEnviando(true);
    
    try {
      const payload = {
        live_id: liveId,
        usuario_id: user.id,
        usuario_nome: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
        mensagem: novaMensagem.trim()
      };

      const { error } = await supabase
        .from('live_chat_messages')
        .insert([payload]);

      if (error) throw error;
      
      const mensagemLocal: Mensagem = {
        id: `local-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString()
      };
      setMensagens(prev => [...prev, mensagemLocal]);
      
      setNovaMensagem('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  };

  const formatarHora = (data: string) => {
    try {
      return new Date(data).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  if (!isLive) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">O chat estará disponível durante a live</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 text-center border border-red-200">
        <p className="text-red-600 text-sm">⚠️ {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden flex flex-col h-[400px] border border-gray-200">
      <div className="bg-[#FFB800] px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-black font-semibold text-sm flex items-center gap-2">
            <span className="text-lg">💬</span> Chat ao Vivo
          </h3>
          <p className="text-black/70 text-xs">
            {mensagens.length} mensagens
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[0.5rem] text-black/50">Ao vivo</span>
        </div>
      </div>

      {/* Container do chat com scroll APENAS AQUI */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
        style={{ overflowY: 'auto' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFB800]"></div>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Nenhuma mensagem ainda. Seja o primeiro a comentar!
          </div>
        ) : (
          mensagens.map((msg) => {
            const isOwnMessage = msg.usuario_id === user?.id;
            
            return (
              <div 
                key={msg.id} 
                className={`flex items-start gap-3 ${
                  isOwnMessage ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isOwnMessage 
                    ? 'bg-[#FFB800] text-black' 
                    : 'bg-gray-700 text-white'
                }`}>
                  {msg.usuario_nome?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className={`flex flex-col max-w-[70%] ${
                  isOwnMessage ? 'items-end' : 'items-start'
                }`}>
                  <div className={`px-3 py-2 rounded-lg ${
                    isOwnMessage 
                      ? 'bg-[#FFB800] text-black rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    <p className="text-sm break-words">{msg.mensagem}</p>
                  </div>
                  <span className="text-[0.6rem] text-gray-400 mt-1">
                    {msg.usuario_nome} • {formatarHora(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {/* Ref para scroll dentro do container */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={enviarMensagem} className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder={user ? "Digite sua mensagem..." : "Faça login para participar"}
            className="flex-1 px-3 py-2 bg-white text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] border border-gray-300 text-sm"
            maxLength={500}
            disabled={!user}
          />
          <button
            type="submit"
            disabled={!novaMensagem.trim() || !user || enviando}
            className="p-2 bg-[#FFB800] text-black rounded-lg hover:bg-[#E6A600] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        {!user && (
          <p className="text-xs text-gray-400 mt-2">
            Faça login para participar do chat
          </p>
        )}
      </form>
    </div>
  );
}
