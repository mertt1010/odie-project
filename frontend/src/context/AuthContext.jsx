import { createContext, useState, useEffect, useContext } from "react";
import AuthService from "../services/AuthService";
import supabase from "../supabase/SupabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to clear auth state
  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem("odie-supabase-auth-token");
  };

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data, error } = await AuthService.getSession();

        if (error) {
          console.error("Session check error:", error);
          // If there's an auth error, clear the session
          if (
            error.message?.includes("refresh_token") ||
            error.message?.includes("Invalid")
          ) {
            clearAuthState();
            await supabase.auth.signOut();
          }
        } else {
          setUser(data.session?.user || null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          if (event === "SIGNED_OUT") {
            clearAuthState();
          } else {
            setUser(session?.user || null);
          }
        } else if (event === "SIGNED_IN") {
          setUser(session?.user || null);
        }

        setLoading(false);
      }
    );

    return () => {
      // Clean up subscription
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
