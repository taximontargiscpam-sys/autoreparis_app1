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

        if (!session && !inAuthGroup && !inPortalGroup && !isTrackingPage) {
            // Redirect to the portal (public entry point)
            router.replace('/portal');
        } else if (session && inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/(tabs)');
        }
    }, [session, segments, isLoading]);
}
