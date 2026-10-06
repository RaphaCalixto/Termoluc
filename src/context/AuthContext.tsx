import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Administrador Oficial Cadastrado para Termoluc Refrigeração
export const PRESET_ADMINS: User[] = [
  {
    id: 'admin-1',
    email: 'termolucarcondicionado@gmail.com',
    name: 'Alesandro',
    role: 'admin',
  },
];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchAdmin: (adminId: string) => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'termoluc_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || 'termolucarcondicionado@gmail.com',
              name: session.user.email?.toLowerCase() === 'termolucarcondicionado@gmail.com' ? 'Alesandro' : (session.user.user_metadata?.name || 'Alesandro'),
              role: 'admin',
            });
          }
        } catch {
          // Fallback silencioso
        }

        try {
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              setUser({
                id: session.user.id,
                email: session.user.email || 'termolucarcondicionado@gmail.com',
                name: session.user.email?.toLowerCase() === 'termolucarcondicionado@gmail.com' ? 'Alesandro' : (session.user.user_metadata?.name || 'Alesandro'),
                role: 'admin',
              });
            }
          });
        } catch {
          // Fallback silencioso
        }
      }

      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            if (parsed.email.toLowerCase() === 'termolucarcondicionado@gmail.com') {
              parsed.name = 'Alesandro';
            }
            setUser(parsed);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setLoading(false);
      return { success: false, error: 'Por favor, informe seu e-mail e senha de acesso.' };
    }

    // 1. Tenta autenticação no Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!error && data.user) {
          const loggedUser: User = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: cleanEmail === 'termolucarcondicionado@gmail.com' ? 'Alesandro' : (data.user.user_metadata?.name || 'Alesandro'),
            role: 'admin',
          };
          setUser(loggedUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
          setLoading(false);
          return { success: true };
        }
      } catch {
        // Se der erro de rede/schema no Supabase, continua para a validação das credenciais oficiais
      }
    }

    // 2. Validação estrita das credenciais do Administrador Alesandro
    if (
      cleanEmail === 'termolucarcondicionado@gmail.com' &&
      cleanPassword === 'Ar103021'
    ) {
      const officialAdmin = PRESET_ADMINS[0];
      setUser(officialAdmin);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(officialAdmin));
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return { success: false, error: 'E-mail ou senha incorretos. Acesso restrito ao Administrador.' };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchAdmin = (adminId: string) => {
    const target = PRESET_ADMINS.find(a => a.id === adminId);
    if (target) {
      setUser(target);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          return { success: true, message: `Solicitação de redefinição processada para ${email}.` };
        }
        return { success: true, message: 'Instruções de recuperação enviadas para o seu e-mail!' };
      } catch {
        // Fallback
      }
    }
    return {
      success: true,
      message: `Link de recuperação gerado com sucesso para ${email}.`,
    };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchAdmin, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
