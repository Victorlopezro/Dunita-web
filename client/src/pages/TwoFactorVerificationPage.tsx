import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TwoFactorVerificationPage() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sessionId = sessionStorage.getItem('oauth_session_id');

  useEffect(() => {
    // Redirect to login if no session ID
    if (!sessionId) {
      navigate('/auth/login');
    }
  }, [sessionId, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const verifyMutation = trpc.auth.google.verifyTwoFactorAndAuth.useMutation({
    onSuccess: (data) => {
      // Clear session storage and redirect to home
      sessionStorage.removeItem('oauth_session_id');
      navigate('/');
    },
    onError: (error) => {
      setError(error.message || 'Error en la verificación');
      setLoading(false);
    },
  });

  const resendMutation = trpc.auth.google.resendTwoFactorCode.useMutation({
    onSuccess: () => {
      setError(null);
      setResendCountdown(60);
    },
    onError: (error) => {
      setError(error.message || 'Error al reenviar el código');
      setResendLoading(false);
    },
  });

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      return; // Only allow single digit
    }

    if (!/^\d*$/.test(value)) {
      return; // Only allow numbers
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Por favor ingresa un código de 6 dígitos');
      return;
    }

    if (!sessionId) {
      setError('Sesión expirada');
      return;
    }

    setLoading(true);
    setError(null);

    verifyMutation.mutate({
      sessionId,
      code: fullCode,
    });
  };

  const handleResend = () => {
    if (!sessionId) {
      setError('Sesión expirada');
      return;
    }

    setResendLoading(true);
    resendMutation.mutate({ sessionId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050302] to-[#0a0604] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-cinzel font-bold text-amber-300">
            DUNE DOMINION
          </h1>
          <p className="text-orange-400 text-sm uppercase tracking-widest">
            Verificación de Identidad
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-black/60 border border-orange-900/40 rounded-lg p-8 space-y-6 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-cinzel font-bold text-orange-300">
              Código de Verificación
            </h2>
            <p className="text-orange-700 text-sm">
              Hemos enviado un código a tu email
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Code Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold rounded border-2 border-orange-900/40 bg-black/40 text-orange-300 focus:border-orange-400 focus:outline-none transition-colors"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Verificando...
                </div>
              ) : (
                'Verificar Código'
              )}
            </Button>
          </form>

          {/* Resend Code Section */}
          <div className="border-t border-orange-900/40 pt-4 text-center">
            <p className="text-orange-700 text-sm mb-3">
              ¿No recibiste el código?
            </p>
            <Button
              onClick={handleResend}
              disabled={resendLoading || resendCountdown > 0}
              variant="ghost"
              className="text-orange-400 hover:text-orange-300"
            >
              {resendCountdown > 0
                ? `Reenviare en ${resendCountdown}s`
                : 'Reenviar código'}
            </Button>
          </div>

          {/* Info text */}
          <div className="bg-orange-950/30 border border-orange-900/40 rounded p-4 text-center">
            <p className="text-orange-300 text-xs leading-relaxed">
              El código expira en 10 minutos.
              <br />
              Revisa tu carpeta de spam si no lo ves.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-orange-700 text-xs">
          <p>Requiere verificación de seguridad</p>
        </div>
      </div>
    </div>
  );
}
