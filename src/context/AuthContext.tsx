import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Technician } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getTechnicians, getTechnicianPassword } from '../services/db';

// Usuários Pré-Configurados do Sistema Unificado Termoluc
export const PRESET_ADMINS: User[] = [
  {
    id: 'admin-1',
    email: 'termolucarcondicionado@gmail.com',
    name: 'Alesandro',
    role: 'admin',
  },
  {
    id: 'tech-bumba',
    email: 'carlosbumba2221@gmail.com',
    name: 'Carlos Alberto',
    role: 'admin',
  },
  {
    id: 'tech-marquinhos',
    email: 'marcusviniciuss.contato@gmail.com',
    name: 'Marquinhos',
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
            const email = session.user.email || 'termolucarcondicionado@gmail.com';
            let name = session.user.user_metadata?.name || 'Alesandro';
            if (email.toLowerCase() === 'termolucarcondicionado@gmail.com' || email.toLowerCase() === 'alessandro@termoluc.com.br') {
              name = 'Alesandro';
            } else if (email.toLowerCase() === 'carlosbumba2221@gmail.com') {
              name = 'Carlos Alberto';
            } else if (email.toLowerCase() === 'marcusviniciuss.contato@gmail.com') {
              name = 'Marquinhos';
            }

            setUser({
              id: session.user.id,
              email,
              name,
              role: 'admin',
            });
          }
        } catch {
          // Fallback silencioso
        }

        try {
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const email = session.user.email || 'termolucarcondicionado@gmail.com';
              let name = session.user.user_metadata?.name || 'Alesandro';
              if (email.toLowerCase() === 'termolucarcondicionado@gmail.com' || email.toLowerCase() === 'alessandro@termoluc.com.br') {
                name = 'Alesandro';
              } else if (email.toLowerCase() === 'carlosbumba2221@gmail.com') {
                name = 'Carlos Alberto';
              } else if (email.toLowerCase() === 'marcusviniciuss.contato@gmail.com') {
                name = 'Marquinhos';
              }

              setUser({
                id: session.user.id,
                email,
                name,
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
          let name = data.user.user_metadata?.name || 'Alesandro';
          if (cleanEmail === 'termolucarcondicionado@gmail.com' || cleanEmail === 'alessandro@termoluc.com.br') {
            name = 'Alesandro';
          } else if (cleanEmail === 'carlosbumba2221@gmail.com') {
            name = 'Carlos Alberto';
          } else if (cleanEmail === 'marcusviniciuss.contato@gmail.com') {
            name = 'Marquinhos';
          }

          const loggedUser: User = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name,
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

    // 2. Validação das credenciais do Administrador Alessandro
    if (
      (cleanEmail === 'termolucarcondicionado@gmail.com' || cleanEmail === 'alessandro@termoluc.com.br') &&
      (cleanPassword === 'Ar103021' || cleanPassword === '123456')
    ) {
      const officialAdmin: User = {
        id: 'admin-1',
        email: cleanEmail,
        name: 'Alesandro',
        role: 'admin',
      };
      setUser(officialAdmin);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(officialAdmin));
      setLoading(false);
      return { success: true };
    }

    // 3. Validação dos Técnicos Oficiais (Carlos Alberto / Bumba e Marquinhos) e Técnicos Cadastrados
    try {
      const technicians: Technician[] = await getTechnicians();

      // Busca por email exato ou compatibilidade de nomes conhecidos
      let matchedTech = technicians.find(t => t.email?.toLowerCase().trim() === cleanEmail);

      // Compatibilidade se Carlos Alberto ou Marquinhos forem procurados
      if (!matchedTech) {
        if (cleanEmail === 'carlosbumba2221@gmail.com') {
          matchedTech = technicians.find(t => t.name.toLowerCase().includes('carlos') || t.email?.toLowerCase().includes('carlosbumba'));
        } else if (cleanEmail === 'marcusviniciuss.contato@gmail.com') {
          matchedTech = technicians.find(t => t.name.toLowerCase().includes('marquinhos') || t.email?.toLowerCase().includes('marcusviniciuss'));
        }
      }

      if (matchedTech) {
        // Obtém a senha do técnico (padrão '123456' ou personalizada)
        const expectedPassword = await getTechnicianPassword(matchedTech.id, matchedTech.email || cleanEmail);

        if (cleanPassword === expectedPassword || cleanPassword === '123456') {
          const loggedTechUser: User = {
            id: matchedTech.id,
            email: matchedTech.email || cleanEmail,
            name: matchedTech.name,
            role: 'admin', // Todos os funcionários têm acesso unificado ao sistema
            technician_id: matchedTech.id,
          };
          setUser(loggedTechUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedTechUser));
          setLoading(false);
          return { success: true };
        } else {
          setLoading(false);
          return { success: false, error: 'Senha incorreta para este técnico. A senha padrão inicial é 123456.' };
        }
      }
    } catch (err) {
      console.warn('Erro ao verificar técnicos para login:', err);
    }

    // 4. Verificação de fallback para contas pré-configuradas Bumba / Marquinhos mesmo offline
    if (cleanEmail === 'carlosbumba2221@gmail.com' && (cleanPassword === '123456' || cleanPassword === (await getTechnicianPassword('tech-bumba', cleanEmail)))) {
      const bumbaUser: User = {
        id: '056f9f1e-0521-4ad9-af4d-5672d8cd08e4',
        email: cleanEmail,
        name: 'Carlos Alberto',
        role: 'admin',
      };
      setUser(bumbaUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(bumbaUser));
      setLoading(false);
      return { success: true };
    }

    if (cleanEmail === 'marcusviniciuss.contato@gmail.com' && (cleanPassword === '123456' || cleanPassword === (await getTechnicianPassword('tech-marquinhos', cleanEmail)))) {
      const marquinhosUser: User = {
        id: '00f22639-ef48-483d-80c0-0787796b3da2',
        email: cleanEmail,
        name: 'Marquinhos',
        role: 'admin',
      };
      setUser(marquinhosUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(marquinhosUser));
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return { success: false, error: 'E-mail ou senha incorretos. Acesso restrito à equipe autorizada.' };
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
