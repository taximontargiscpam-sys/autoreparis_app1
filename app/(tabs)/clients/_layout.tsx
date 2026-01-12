
import { Stack } from 'expo-router';

export default function ClientsLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' }
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen
                name="new_client"
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    title: 'Nouveau Client',
                    headerBackTitle: 'Annuler'
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: true,
                    title: 'Détails Client',
                    headerBackTitle: 'Retour'
                }}
            />
        </Stack>
    );
}
