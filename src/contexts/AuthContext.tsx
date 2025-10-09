import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isPasswordRecovery: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Check URL hash for recovery tokens on mount
    const checkRecoveryToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      console.log('Hash params - type:', type, 'access_token present:', !!accessToken);
      
      if (type === 'recovery') {
        setIsPasswordRecovery(true);
        console.log('Password recovery detected - signing out any existing session');
        
        // SECURITY: Sign out immediately if user was auto-logged in
        // This prevents accessing the account without changing password
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      }
    };
    
    checkRecoveryToken();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          // SECURITY: Sign out to prevent unauthorized access
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't set session if we're in recovery mode
      if (!isPasswordRecovery) {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isPasswordRecovery }}>
      {children}
    </AuthContext.Provider>
  );
};
