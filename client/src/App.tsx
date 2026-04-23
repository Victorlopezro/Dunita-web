import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GoogleLoginPage from "./pages/GoogleLoginPage";
import TwoFactorVerificationPage from "./pages/TwoFactorVerificationPage";
import { useAuth } from "./_core/hooks/useAuth";
import { ReactNode } from "react";

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050302] to-[#0a0604] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/auth/login";
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path={"/auth/login"} component={GoogleLoginPage} />
      <Route path={"/auth/2fa-verify"} component={TwoFactorVerificationPage} />
      <Route path={"/"}>
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
