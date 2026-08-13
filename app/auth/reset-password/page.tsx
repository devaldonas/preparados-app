// app/auth/reset-password/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Check, AlertCircle, Shield } from 'lucide-react';

// Componente que usa useSearchParams (deve ser envolvido em Suspense)
function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyToken = async () => {
      setIsVerifying(true);
      
      const hasQueryToken = searchParams?.has('access_token') || searchParams?.has('refresh_token');
      const hasHashToken = window.location.hash && window.location.hash.includes('access_token');
      
      if (hasHashToken) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error('Erro ao definir sessão:', error);
              setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
              setIsValidToken(false);
            } else {
              console.log('✅ Token verificado com sucesso via hash');
              setIsValidToken(true);
            }
          } catch (err) {
            console.error('Erro ao verificar token:', err);
            setError('Erro ao verificar o link de recuperação.');
            setIsValidToken(false);
          }
        }
      } 
      else if (hasQueryToken) {
        const accessToken = searchParams?.get('access_token');
        const refreshToken = searchParams?.get('refresh_token');
        
        if (accessToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error('Erro ao definir sessão:', error);
              setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
              setIsValidToken(false);
            } else {
              console.log('✅ Token verificado com sucesso via query params');
              setIsValidToken(true);
            }
          } catch (err) {
            console.error('Erro ao verificar token:', err);
            setError('Erro ao verificar o link de recuperação.');
            setIsValidToken(false);
          }
        }
      } 
      else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ Usuário já autenticado via sessão');
          setIsValidToken(true);
        } else {
          console.log('❌ Nenhum token encontrado');
          setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
          setIsValidToken(false);
        }
      }
      
      setIsVerifying(false);
    };

    verifyToken();
  }, [searchParams]);

  const checkPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const getStrengthLabel = (strength: number) => {
    if (strength <= 1) return { label: 'Fraca', color: 'text-red-500', bg: 'bg-red-500' };
    if (strength <= 2) return { label: 'Média', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (strength <= 3) return { label: 'Boa', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (strength <= 4) return { label: 'Forte', color: 'text-green-500', bg: 'bg-green-500' };
    return { label: 'Muito Forte', color: 'text-green-600', bg: 'bg-green-600' };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage('✅ Senha atualizada com sucesso!');
      
      setTimeout(() => {
        router.push('/auth/login?reset=success');
      }, 2000);

    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message || 'Erro ao atualizar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const strengthInfo = getStrengthLabel(passwordStrength);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verificando link...</h1>
          <p className="text-gray-600 text-sm mt-2">Aguarde enquanto verificamos seu link de recuperação.</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Inválido ou Expirado</h1>
          <p className="text-gray-600 text-sm mb-6">
            {error || 'O link de redefinição de senha é inválido ou expirou. Solicite um novo link.'}
          </p>
          <button
            onClick={() => router.push('/auth/recuperar-senha')}
            className="w-full bg-[#FFB800] text-black py-2 rounded-lg font-semibold hover:bg-[#E5A600] transition"
          >
            Solicitar novo link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FFB800]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-[#FFB800]" />
          </div>
          <h1 className="text-2xl font-bold text-black">Redefinir Senha</h1>
          <p className="text-gray-600 text-sm mt-2">Digite sua nova senha abaixo</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
            <Check size={16} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent transition"
                disabled={loading}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition focus:outline-none"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-gray-500 hover:text-gray-700" />
                ) : (
                  <Eye size={20} className="text-gray-500 hover:text-gray-700" />
                )}
              </button>
            </div>

            {/* Indicador de força da senha */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex gap-1 h-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          i < passwordStrength
                            ? i <= 1 ? 'bg-red-500' :
                              i <= 2 ? 'bg-yellow-500' :
                              i <= 3 ? 'bg-blue-500' :
                              'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strengthInfo.color} min-w-[70px] text-right`}>
                    {strengthInfo.label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {password.length < 6 && password.length > 0 && (
                    <span className="text-red-500">• Mínimo 6 caracteres</span>
                  )}
                  {password.length >= 6 && (
                    <span className="text-green-500">• ✓ Tamanho mínimo atingido</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent transition"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={toggleShowConfirmPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition focus:outline-none"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} className="text-gray-500 hover:text-gray-700" />
                ) : (
                  <Eye size={20} className="text-gray-500 hover:text-gray-700" />
                )}
              </button>
            </div>
            
            {confirmPassword.length > 0 && (
              <div className="mt-2">
                {password !== confirmPassword ? (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle size={14} />
                    <span>As senhas não coincidem</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-500 text-xs">
                    <Check size={14} />
                    <span>Senhas coincidem ✓</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dicas de segurança */}
          {password.length > 0 && password.length < 6 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                💡 Dica: Use pelo menos 6 caracteres, incluindo letras maiúsculas, números e símbolos para uma senha mais segura.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirmPassword}
            className="w-full bg-[#FFB800] text-black py-3 rounded-lg font-semibold hover:bg-[#E5A600] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Atualizando...
              </span>
            ) : (
              'Atualizar Senha'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center justify-center gap-1 mx-auto"
          >
            <span>←</span> Voltar para o login
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Precisa de ajuda? Entre em contato com nosso suporte
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Carregando...</h1>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}