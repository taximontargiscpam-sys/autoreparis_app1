import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewClientScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        telephone: '',
        email: '',
        adresse: '',
        ville: '',
        code_postal: ''
    });

    const [vehicleData, setVehicleData] = useState({
        marque: '',
        modele: '',
        immatriculation: ''
    });

    const handleCreate = async () => {
        if (!formData.nom) {
            Alert.alert('Erreur', 'Le nom est obligatoire.');
            return;
        }

        // Debug Session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current User ID:", session?.user?.id);

        if (!session) {
            Alert.alert('Erreur', 'Vous n\'êtes pas connecté.');
            return;
        }

        setLoading(true);

        // 1. Create Client
        const { data: client, error } = await supabase
            .from('clients')
            .insert([formData])
            .select()
            .single();

        if (error) {
            console.error(error);
            setLoading(false);
            Alert.alert('Erreur', "Impossible de créer le client. " + (error.message || ''));
            return;
        }

        // 2. Create Vehicle if data provided
        if (vehicleData.marque || vehicleData.modele || vehicleData.immatriculation) {
            const { error: vehError } = await supabase
                .from('vehicles')
                .insert([{
                    ...vehicleData,
                    client_id: client.id
                }]);

            if (vehError) {
                console.error("Vehicle Error:", vehError);
                Alert.alert('Attention', 'Client créé mais impossible d\'associer le véhicule.');
            }
        }

        setLoading(false);
        Alert.alert('Succès', 'Client ajouté avec succès !');
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <ScrollView className="flex-1 p-6">
                    <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">

                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-6">Informations Personnelles</Text>

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Prénom</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium"
                                    placeholder="Jean"
                                    placeholderTextColor="#94a3b8"
                                    value={formData.prenom}
                                    onChangeText={(text) => setFormData({ ...formData, prenom: text })}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Nom *</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium"
                                    placeholder="Dupont"
                                    placeholderTextColor="#94a3b8"
                                    value={formData.nom}
                                    onChangeText={(text) => setFormData({ ...formData, nom: text })}
                                />
                            </View>
                        </View>

                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Email</Text>
                        <TextInput
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium mb-4"
                            placeholder="client@email.com"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                        />

                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Téléphone</Text>
                        <TextInput
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium mb-4"
                            placeholder="06 12 34 56 78"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            value={formData.telephone}
                            onChangeText={(text) => setFormData({ ...formData, telephone: text })}
                        />

                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-6 mt-4">Adresse</Text>

                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Adresse postale</Text>
                        <TextInput
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium mb-4"
                            placeholder="123 Rue de la République"
                            placeholderTextColor="#94a3b8"
                            value={formData.adresse}
                            onChangeText={(text) => setFormData({ ...formData, adresse: text })}
                        />

                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Code Postal</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium"
                                    placeholder="75001"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={formData.code_postal}
                                    onChangeText={(text) => setFormData({ ...formData, code_postal: text })}
                                />
                            </View>
                            <View className="flex-[2]">
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Ville</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium"
                                    placeholder="Paris"
                                    placeholderTextColor="#94a3b8"
                                    value={formData.ville}
                                    onChangeText={(text) => setFormData({ ...formData, ville: text })}
                                />
                            </View>
                        </View>

                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-6 mt-8">Véhicule (Optionnel)</Text>

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Marque</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium"
                                    placeholder="Renault"
                                    placeholderTextColor="#94a3b8"
                                    value={vehicleData.marque}
                                    onChangeText={(text) => setVehicleData({ ...vehicleData, marque: text })}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Modèle</Text>
                                <TextInput
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium"
                                    placeholder="Clio V"
                                    placeholderTextColor="#94a3b8"
                                    value={vehicleData.modele}
                                    onChangeText={(text) => setVehicleData({ ...vehicleData, modele: text })}
                                />
                            </View>
                        </View>

                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Immatriculation</Text>
                        <TextInput
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white font-medium"
                            placeholder="AB-123-CD"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="characters"
                            value={vehicleData.immatriculation}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, immatriculation: text })}
                        />

                    </View>

                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={loading}
                        className={`bg-blue-600 p-5 rounded-xl flex-row items-center justify-center shadow-lg shadow-blue-500/30 mb-10 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <Text className="text-white font-bold text-lg">Création en cours...</Text>
                        ) : (
                            <>
                                <Save size={24} color="white" className="mr-3" />
                                <Text className="text-white font-bold text-lg">Enregistrer le client</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
