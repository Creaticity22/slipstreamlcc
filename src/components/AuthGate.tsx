import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import WelcomeScreen from "@/components/WelcomeScreen";

const PUBLIC_PATH_PREFIXES = ["/trip/share/", "/trust", "/privacy"];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));

const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isPublicPath(location.pathname)) {
    return <WelcomeScreen />;
  }

  return <>{children}</>;
};

export default AuthGate;
