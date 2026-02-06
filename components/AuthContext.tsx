import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../lib/database.types';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    userRole: UserRole | null;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
    userRole: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userRole, setUserRole] = useState<UserRole | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            fetchUserRole(session?.user);
            setSessionLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                fetchUserRole(session?.user);
                setSessionLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (user: User | undefined) => {
        if (!user) {
            setIsAdmin(false);
            setUserRole(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error || !data) {
                setIsAdmin(false);
                setUserRole('lecture');
                return;
            }

            const role = data.role as UserRole;
            setUserRole(role);
            setIsAdmin(role === 'admin');
        } catch {
            setIsAdmin(false);
            setUserRole('lecture');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                isAuthenticated: !!session?.user,
                isLoading: sessionLoading,
                isAdmin,
                userRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
