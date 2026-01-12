import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            checkUserRole(session?.user);
            setSessionLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                checkUserRole(session?.user);
                setSessionLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const checkUserRole = async (user: User | undefined) => {
        if (!user) {
            setIsAdmin(false);
            return;
        }
        // In a real app, you would fetch the user role from the 'users' table
        // For now, we'll assume everyone isn't admin unless specified or we fetch it.
        // Let's implement a quick fetch if we can, or just leave it for later.
        // For V1 prototype, we can check if the user metadata has a role or just fetch from public.users

        // const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
        // setIsAdmin(data?.role === 'admin');
        setIsAdmin(false); // Placeholder
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                isAuthenticated: !!session?.user,
                isLoading: sessionLoading,
                isAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
