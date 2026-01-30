import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../components/AuthContext';

export function useProtectedRoute() {
    const { session, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inPortalGroup = segments[0] === 'portal';
        const isTrackingPage = segments[0] === 'tracking';
        const isPublicPage = segments[0] === 'public';
        const isHomePage = (segments.length as number) === 0 || ((segments.length as number) === 1 && segments[0] === 'index');

        // Public routes: home, portal, tracking, public/*, auth
        const isPublicRoute = inAuthGroup || inPortalGroup || isTrackingPage || isPublicPage || isHomePage;

        if (!session && !isPublicRoute) {
            // Redirect unauthenticated users away from protected routes
            router.replace('/');
        } else if (session && inAuthGroup) {
            // Redirect authenticated users away from the sign-in page
            router.replace('/(tabs)');
        }
    }, [session, segments, isLoading]);
}
