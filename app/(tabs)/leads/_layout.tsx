
import { Stack } from 'expo-router';

export default function LeadsLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" options={{ presentation: 'modal', headerShown: true, title: 'Détails de la demande', headerBackTitle: 'Retour' }} />
        </Stack>
    );
}
