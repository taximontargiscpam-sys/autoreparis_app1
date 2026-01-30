import { useRouter } from 'expo-router';
import { Car, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

export default function ClientLoginScreen() {
    const [plate, setPlate] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSearch() {
        if (!plate) {
            Alert.alert('Erreur', 'Veuillez entrer une plaque d\'immatriculation.');
            return;
        }

        setLoading(true);
        // 1. Find the vehicle
        const { data: vehicles, error: vError } = await supabase
            .from('vehicles')
            .select('id, client_id')
            .ilike('immatriculation', plate.trim());

        if (vError) {
            Alert.alert('Erreur', 'Une erreur est survenue lors de la recherche. Veuillez réessayer.');
            setLoading(false);
            return;
        }

        if (!vehicles || vehicles.length === 0) {
            Alert.alert('Introuvable', `Aucun véhicule trouvé pour la plaque ${plate.trim()}. Vérifiez l'immatriculation et réessayez.`);
            setLoading(false);
            return;
        }

        // Robust Search: Iterate through ALL matching vehicles to find one with an active intervention.
        // This handles cases where "Zombie" vehicles exist from failed seed attempts
        let validIntervention = null;

        for (const vehicle of vehicles) {
            const { data: intervention, error: iError } = await supabase
                .from('interventions')
                .select('id, statut')
                .eq('vehicle_id', vehicle.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (intervention) {
                validIntervention = intervention;
                break; // Found one!
            }
        }

        if (!validIntervention) {
            Alert.alert('Information', 'Aucune intervention en cours n\'est associée à ce véhicule.');
            setLoading(false);
            return;
        }

        // Set ID in global store to ensure it reaches the tracking screen
        globalStore.setId(validIntervention.id);

        // Redirect to tracking page
        router.push('/tracking');
        setLoading(false);
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center items-center p-6"
            >
                <View className="w-full max-w-sm">
                    <View className="items-center mb-12">
                        <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
                            <Car size={48} color="white" />
                        </View>
                        <Text className="text-3xl font-bold text-white text-center">Suivi Atelier</Text>
                        <Text className="text-gray-400 text-center mt-2">Suivez les réparations de votre véhicule en temps réel.</Text>
                    </View>

                    <View className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
                        <Text className="text-gray-300 font-medium mb-2 uppercase text-xs tracking-wider">Immatriculation</Text>
                        <View className="flex-row items-center bg-slate-700 rounded-xl h-14 px-4 border border-slate-600 mb-6">
                            <Car size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-white text-lg font-bold uppercase"
                                placeholder="AA-123-BB"
                                placeholderTextColor="#64748b"
                                value={plate}
                                onChangeText={setPlate}
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity
                            className="bg-primary h-14 rounded-xl items-center justify-center flex-row shadow-lg shadow-blue-900/20 active:bg-blue-700"
                            onPress={handleSearch}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text className="text-white font-bold text-lg">Recherche...</Text>
                            ) : (
                                <>
                                    <Search size={22} color="white" className="mr-2" />
                                    <Text className="text-white font-bold text-lg">Suivre mon véhicule</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity className="mt-12 border-t border-slate-800 pt-6 w-full items-center" onPress={() => router.push('/(auth)/login')}>
                        <Text className="text-slate-600 mb-1 text-xs">Vous êtes un garage ?</Text>
                        <Text className="text-primary font-bold">Connexion Espace Pro</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
