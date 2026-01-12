
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Car, Mail, MapPin, Phone, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ClientDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ marque: '', modele: '', immatriculation: '' });

    useEffect(() => {
        if (id) {
            fetchClient();
            fetchVehicles();
        }
    }, [id]);

    const fetchClient = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            Alert.alert('Erreur', "Impossible de charger le client.");
            router.back();
        } else {
            setClient(data);
        }
        setLoading(false);
    };

    const fetchVehicles = async () => {
        const { data } = await supabase
            .from('vehicles')
            .select('*')
            .eq('client_id', id);
        setVehicles(data || []);
    };

    const handleAddVehicle = async () => {
        if (!newVehicle.marque || !newVehicle.immatriculation) {
            Alert.alert('Erreur', 'Marque et Immatriculation requises');
            return;
        }

        const { error } = await supabase.from('vehicles').insert([
            { ...newVehicle, client_id: id }
        ]);

        if (error) {
            Alert.alert('Erreur', error.message);
        } else {
            setModalVisible(false);
            setNewVehicle({ marque: '', modele: '', immatriculation: '' });
            fetchVehicles();
        }
    };

    const handleCall = () => {
        if (client?.telephone) Linking.openURL(`tel:${client.telephone}`);
    };

    const handleEmail = () => {
        if (client?.email) Linking.openURL(`mailto:${client.email}`);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!client) return null;

    return (
        <ScrollView className="flex-1 bg-white dark:bg-slate-950">
            <View className="p-6">
                <View className="items-center mb-8">
                    <View className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
                        <User size={40} className="text-slate-400" />
                    </View>
                    <Text className="text-3xl font-bold text-slate-900 dark:text-white text-center">
                        {client.prenom} {client.nom}
                    </Text>
                    <Text className="text-slate-500 mt-1">Client depuis {new Date(client.created_at).getFullYear()}</Text>
                </View>

                <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 mb-6">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Coordonnées</Text>

                    <TouchableOpacity onPress={handleCall} className="flex-row items-center py-3 border-b border-slate-200 dark:border-slate-800">
                        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center mr-4">
                            <Phone size={20} className="text-slate-600 dark:text-slate-400" />
                        </View>
                        <View>
                            <Text className="text-slate-500 text-xs font-bold uppercase">Téléphone</Text>
                            <Text className="text-blue-600 font-medium text-base">{client.telephone || 'Non renseigné'}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleEmail} className="flex-row items-center py-3 border-b border-slate-200 dark:border-slate-800">
                        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center mr-4">
                            <Mail size={20} className="text-slate-600 dark:text-slate-400" />
                        </View>
                        <View>
                            <Text className="text-slate-500 text-xs font-bold uppercase">Email</Text>
                            <Text className="text-blue-600 font-medium text-base">{client.email || 'Non renseigné'}</Text>
                        </View>
                    </TouchableOpacity>

                    <View className="flex-row items-center py-3">
                        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center mr-4">
                            <MapPin size={20} className="text-slate-600 dark:text-slate-400" />
                        </View>
                        <View>
                            <Text className="text-slate-500 text-xs font-bold uppercase">Adresse</Text>
                            <Text className="text-slate-900 dark:text-white font-medium text-base">
                                {client.adresse || ''} {client.code_postal} {client.ville}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Vehicles List */}
                <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">Véhicules ({vehicles.length})</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                        >
                            <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">+ Ajouter</Text>
                        </TouchableOpacity>
                    </View>

                    {vehicles.length === 0 ? (
                        <View className="items-center py-6">
                            <Car size={32} className="text-slate-300 mb-2" />
                            <Text className="text-slate-400 text-sm">Aucun véhicule associé</Text>
                        </View>
                    ) : (
                        vehicles.map(v => (
                            <View key={v.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-3 border border-slate-100 dark:border-slate-700 flex-row justify-between items-center">
                                <View>
                                    <Text className="font-bold text-slate-900 dark:text-white text-base">{v.marque} {v.modele}</Text>
                                    <Text className="text-slate-500 text-sm uppercase">{v.immatriculation}</Text>
                                </View>
                                <Car size={20} className="text-slate-400" />
                            </View>
                        ))
                    )}
                </View>

                {/* Add Vehicle Modal */}
                {modalVisible && (
                    <View className="absolute inset-0 z-50 justify-center items-center">
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => setModalVisible(false)}
                            className="absolute inset-0 bg-black/50"
                        />
                        <View className="bg-white dark:bg-slate-900 w-[90%] rounded-2xl p-6 shadow-xl">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-6">Nouveau Véhicule</Text>

                            <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Marque</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 text-slate-900 dark:text-white"
                                placeholder="Renault"
                                placeholderTextColor="#94a3b8"
                                value={newVehicle.marque}
                                onChangeText={t => setNewVehicle({ ...newVehicle, marque: t })}
                            />

                            <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Modèle</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 text-slate-900 dark:text-white"
                                placeholder="Clio V"
                                placeholderTextColor="#94a3b8"
                                value={newVehicle.modele}
                                onChangeText={t => setNewVehicle({ ...newVehicle, modele: t })}
                            />

                            <Text className="text-slate-500 text-xs font-bold uppercase mb-2">Immatriculation</Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-6 text-slate-900 dark:text-white"
                                placeholder="AB-123-CD"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="characters"
                                value={newVehicle.immatriculation}
                                onChangeText={t => setNewVehicle({ ...newVehicle, immatriculation: t })}
                            />

                            <TouchableOpacity
                                onPress={handleAddVehicle}
                                className="bg-blue-600 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-lg">Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </View>
        </ScrollView>
    );
}
