import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

interface GoogleCredentialResponse {
  clientId: string;
  credential: string;
  select_by: string;
}

export default function GoogleLoginPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleCallbackMutation = trpc.auth.google.googleCallback.useMutation({
    onSuccess: (data) => {
      // Store session ID and navigate to 2FA verification
      sessionStorage.setItem('oauth_session_id', data.sessionId);
      navigate('/auth/2fa-verify');
    },
    onError: (error) => {
      setError(error.message || 'Error en la autenticación');
      setLoading(false);
    },
  });

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Initialize Google Sign-In after script loads
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'filled_black',
            size: 'large',
            width: '300',
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleSignIn = (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setError('No se pudo obtener el token de Google');
      return;
    }

    setLoading(true);
    setError(null);

    // Call backend to verify token and generate 2FA code
    // The credential is a JWT that we need to send to the backend
    googleCallbackMutation.mutate({
      code: response.credential,
      redirectUri: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050302] to-[#0a0604] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-cinzel font-bold text-amber-300">
            DUNE DOMINION
          </h1>
          <p className="text-orange-400 text-sm uppercase tracking-widest">
            Catálogo de Criaturas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-black/60 border border-orange-900/40 rounded-lg p-8 space-y-6 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-2xl font-cinzel font-bold text-orange-300 mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-orange-700 text-sm">
              Accede con tu cuenta de Google
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <div className="flex justify-center">
            <div id="google-signin-button" />
          </div>

          {/* Alternative text */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orange-900/40" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/60 text-orange-700">
                Usa tu cuenta de Gmail
              </span>
            </div>
          </div>

          {/* Info text */}
          <div className="bg-orange-950/30 border border-orange-900/40 rounded p-4 text-center">
            <p className="text-orange-300 text-xs leading-relaxed">
              Recibirás un código de verificación en tu email para confirmar tu identidad.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-orange-700 text-xs">
          <p>
            Al iniciar sesión, aceptas nuestros términos de servicio
          </p>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface for Google Sign-In
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}
