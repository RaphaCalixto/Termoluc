import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';

export const Login: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal de Recuperação de Senha
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error('Por favor, informe seu e-mail e senha de acesso.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      success('Login realizado com sucesso! Bem-vindo ao sistema.');
      navigate('/');
    } else {
      error(result.error || 'Credenciais inválidas.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      error('Informe seu e-mail para recuperação.');
      return;
    }

    setForgotLoading(true);
    const res = await resetPassword(forgotEmail);
    setForgotLoading(false);

    if (res.success) {
      success(res.message);
      setForgotModalOpen(false);
      setForgotEmail('');
    } else {
      error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-termoluc-950 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-termoluc-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl mb-4">
            <img
              src="/TERMOLUC_logo.png"
              alt="Termoluc Refrigeração"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            TERMOLUC REFRIGERAÇÃO
          </h2>
          <p className="mt-1 text-xs text-slate-300 font-medium">
            Sistema de Gestão & Ordens de Serviço • Acesso Administrativo
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-white/20">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-termoluc-600 hover:text-termoluc-700"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm text-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-termoluc-600 hover:bg-termoluc-700 active:scale-98 transition-all shadow-md shadow-termoluc-600/30 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Recuperação de Senha"
        subtitle="Informe o e-mail cadastrado do administrador"
        maxWidth="md"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              E-mail para redefinição
            </label>
            <input
              type="email"
              required
              placeholder="termolucarcondicionado@gmail.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          <div className="p-3 bg-blue-50 text-termoluc-800 rounded-xl text-xs flex items-start gap-2 border border-blue-100">
            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-termoluc-600" />
            <span>Um link de redefinição de senha segura será encaminhado para o e-mail do administrador.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={forgotLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-termoluc-600 hover:bg-termoluc-700 rounded-xl disabled:opacity-50"
            >
              {forgotLoading ? 'Enviando...' : 'Enviar Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
