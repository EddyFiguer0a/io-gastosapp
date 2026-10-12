import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatAuthError } from '../lib/validation';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(formatAuthError(signInError.message));
        }
      } else {
        const { error: signUpError, user: newUser } = await signUp(
          email.trim(),
          password,
          name.trim()
        );
        if (signUpError) {
          setError(formatAuthError(signUpError.message));
        } else if (newUser && !newUser.confirmed_at && newUser.identities?.length) {
          setInfoMessage('¡Cuenta creada! Si tu proyecto tiene confirmación activada, revisa tu correo para verificar tu cuenta.');
        }
      }
    } catch (err: any) {
      setError(formatAuthError(err?.message || 'Error de autenticación'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-[var(--bg-main)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--accent)] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
            {isLogin ? <LogIn className="w-8 h-8 text-black" /> : <UserPlus className="w-8 h-8 text-black" />}
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">GastosApp</h1>
          <p className="text-[var(--text-muted)] font-medium mt-1">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta privada'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border-subtle)] shadow-[var(--card-shadow)] space-y-4 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent)]" />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required={!isLogin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all font-semibold"
                placeholder="Juan Pérez"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all font-semibold"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 ml-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-card-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all font-semibold"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[0.98] transition-transform disabled:opacity-70 mt-2 shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              <>Ingresar</>
            ) : (
              <>Crear Cuenta</>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setInfoMessage(null);
            }}
            className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};
