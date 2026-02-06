import { useCreateClient, useCreateVehicle } from '@/lib/hooks/useClients';
import { clientSchema, vehicleSchema, getValidationError } from '@/lib/validations';
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

    const createClient = useCreateClient();
    const createVehicle = useCreateVehicle();

    const hasVehicleData = vehicleData.marque || vehicleData.modele || vehicleData.immatriculation;

    const handleCreate = async () => {
        // Validate client data
        const clientResult = clientSchema.safeParse(formData);
        const clientError = getValidationError(clientResult);
        if (clientError) {
            Alert.alert('Erreur de validation', clientError);
            return;
        }

        // Validate vehicle data if any field is filled
        if (hasVehicleData) {
            const vehicleResult = vehicleSchema.safeParse(vehicleData);
            const vehicleError = getValidationError(vehicleResult);
            if (vehicleError) {
                Alert.alert('Erreur de validation', vehicleError);
                return;
            }
        }

        setLoading(true);

        try {
            // 1. Create Client
            const client = await createClient.mutateAsync(clientResult.data! as any);

            // 2. Create Vehicle if data provided
            if (hasVehicleData) {
                try {
                    const vehicleResult = vehicleSchema.safeParse(vehicleData);
                    await createVehicle.mutateAsync({
                        ...vehicleResult.data!,
                        client_id: client.id,
                    } as any);
                } catch (vehErr: any) {
                    console.error("Vehicle Error:", vehErr);
                    Alert.alert('Attention', "Client cree mais impossible d'associer le vehicule.");
                }
            }

            setLoading(false);
            Alert.alert('Succes', 'Client ajoute avec succes !');
            router.back();
        } catch (err: any) {
            console.error(err);
            setLoading(false);
            Alert.alert('Erreur', "Impossible de creer le client. " + (err.message || ''));
        }
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
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Prenom</Text>
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

                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Telephone</Text>
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
                            placeholder="123 Rue de la Republique"
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

                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-6 mt-8">Vehicule (Optionnel)</Text>

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
                                <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Modele</Text>
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
                            <Text className="text-white font-bold text-lg">Creation en cours...</Text>
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
