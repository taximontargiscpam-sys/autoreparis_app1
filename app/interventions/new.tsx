import { supabase } from '@/lib/supabase';
import { supabaseWebsite } from '@/lib/supabaseWebsite';
import { clientSchema, getValidationError, interventionSchema, vehicleSchema } from '@/lib/validations';
import { useQueryClient } from '@tanstack/react-query';
import { addDays, startOfToday } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Car, Save, Trash2, User, Wrench } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewInterventionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const qc = useQueryClient();
    const [loading, setLoading] = useState(false);

    // Form State
    const [client, setClient] = useState({ nom: '', prenom: '', telephone: '', email: '' });
    const [vehicle, setVehicle] = useState({ marque: '', modele: '', immatriculation: '', kilometrage: '' });
    const [typeIntervention, setTypeIntervention] = useState('Entretien');
    const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [commentaire, setCommentaire] = useState('');
    const [estimatedPrice, setEstimatedPrice] = useState('');

    // Pre-fill data if coming from Lead Conversion
    useEffect(() => {
        if (params.lead_id) {
            setClient(prev => ({
                ...prev,
                nom: (params.nom as string) || prev.nom,
                prenom: (params.prenom as string) || prev.prenom,
                telephone: (params.telephone as string) || prev.telephone,
                email: (params.email as string) || prev.email
            }));
            setVehicle(prev => ({
                ...prev,
                marque: (params.marque as string) || prev.marque,
                modele: (params.modele as string) || prev.modele,
                immatriculation: (params.immatriculation as string) || prev.immatriculation
            }));
            if (params.commentaire) {
                setCommentaire((params.commentaire as string));
            }
        }
    }, [params.lead_id]);

    // Date & Time State
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [selectedTime, setSelectedTime] = useState('09:00');

    const interventionTypes = ['Entretien', 'Mécanique', 'Carrosserie', 'Pneus', 'Diagnostic', 'Autre'];

    // Generate next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => addDays(startOfToday(), i));
    const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    const pickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', "L'accès à la caméra est nécessaire pour prendre des photos.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            allowsEditing: true,
        });

        if (!result.canceled) {
            setPhotos([...photos, result.assets[0]]);
        }
    };

    const handleCreate = async () => {
        // --- Zod Validation ---
        const clientResult = clientSchema.safeParse(client);
        const clientError = getValidationError(clientResult);
        if (clientError) {
            Alert.alert('Erreur client', clientError);
            return;
        }

        const vehicleResult = vehicleSchema.safeParse({
            ...vehicle,
            kilometrage: vehicle.kilometrage ? parseInt(vehicle.kilometrage, 10) : undefined,
        });
        const vehicleError = getValidationError(vehicleResult);
        if (vehicleError) {
            Alert.alert('Erreur véhicule', vehicleError);
            return;
        }

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const interventionDate = new Date(selectedDate);
        interventionDate.setHours(hours, minutes, 0, 0);

        const interventionResult = interventionSchema.safeParse({
            type_intervention: typeIntervention,
            date_heure_debut_prevue: interventionDate.toISOString(),
            commentaire,
            total_vente: parseFloat(estimatedPrice.replace(',', '.')) || 0,
        });
        const interventionError = getValidationError(interventionResult);
        if (interventionError) {
            Alert.alert('Erreur intervention', interventionError);
            return;
        }

        setLoading(true);
        try {
            // Create intervention via RPC (creates client + vehicle + intervention atomically)
            const { data: interventionId, error: rpcError } = await supabase.rpc('create_full_intervention', {
                p_client_nom: client.nom,
                p_client_prenom: client.prenom,
                p_client_telephone: client.telephone,
                p_client_email: client.email,
                p_vehicle_marque: vehicle.marque,
                p_vehicle_modele: vehicle.modele,
                p_vehicle_immatriculation: vehicle.immatriculation,
                p_vehicle_kilometrage: parseInt(vehicle.kilometrage, 10) || 0,
                p_type_intervention: typeIntervention,
                p_date_heure_debut_prevue: interventionDate.toISOString(),
                p_commentaire: commentaire,
                p_total_vente: parseFloat(estimatedPrice.replace(',', '.')) || 0,
            });

            if (rpcError) throw rpcError;

            // Upload Photos after intervention is created
            for (const photo of photos) {
                const formData = new FormData();
                formData.append('file', {
                    uri: photo.uri,
                    name: `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                } as any);

                const fileName = `${interventionId}/${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage
                    .from('vehicle-photos')
                    .upload(fileName, formData);

                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage.from('vehicle-photos').getPublicUrl(fileName);
                    if (publicUrlData) {
                        await supabase.from('vehicle_photos').insert([{
                            intervention_id: interventionId,
                            url_image: publicUrlData.publicUrl,
                            type: 'etat_initial'
                        }]);
                    }
                }
            }

            // Delete Lead after conversion
            if (params.lead_id) {
                const { error: deleteLeadError } = await supabaseWebsite
                    .from('devis_auto')
                    .delete()
                    .eq('id', params.lead_id);

                if (deleteLeadError && __DEV__) console.error("Error deleting lead:", deleteLeadError);
            }

            // Invalidate React Query caches so lists & dashboard update
            qc.invalidateQueries({ queryKey: ['interventions'] });
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] });

            Alert.alert('Succès', 'Intervention planifiée avec succès !');
            router.back();

        } catch (error: unknown) {
            if (__DEV__) console.error(error);
            Alert.alert('Erreur', "La création de l'intervention a échoué. Vérifiez les informations et réessayez.");
        } finally {
            setLoading(false);
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setPhotos(newPhotos);
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            {/* Header Dark Blue */}
            <View className="px-6 py-4 border-b border-slate-800">
                <View className="flex-row items-center mb-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-slate-800 p-2 rounded-full">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text className="text-2xl font-black text-white">Nouvelle Intervention</Text>
                </View>
                <Text className="text-slate-400 ml-12 text-sm">Remplissez les informations pour créer un dossier.</Text>
            </View>

            <View className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>

                        {/* Type d'intervention (New) */}
                        <View className="mb-8">
                            <View className="flex-row items-center mb-4">
                                <Wrench size={18} color="#3b82f6" className="mr-2" />
                                <Text className="font-bold text-slate-300 uppercase text-xs tracking-wider">Type d'intervention</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                                {interventionTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setTypeIntervention(type)}
                                        className={`mr-3 px-5 py-3 rounded-xl border ${typeIntervention === type ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-800'}`}
                                    >
                                        <Text className={`font-bold ${typeIntervention === type ? 'text-white' : 'text-slate-400'}`}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Date & Time Section */}
                        <View className="mb-8">
                            <View className="flex-row items-center mb-4">
                                <View className="bg-blue-600/20 p-2 rounded-full mr-3">
                                    <Text className="text-blue-400 font-bold text-xs">📅</Text>
                                </View>
                                <Text className="font-bold text-slate-300 uppercase text-xs tracking-wider">Date & Heure de rendez-vous</Text>
                            </View>

                            {/* Date Strip */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 mb-4">
                                {dates.map((date, index) => {
                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => setSelectedDate(date)}
                                            className={`mr-3 p-3 rounded-xl border border-slate-800 items-center justify-center w-16 ${isSelected ? 'bg-blue-600 border-blue-500' : 'bg-slate-900'}`}
                                        >
                                            <Text className={`text-xs uppercase mb-1 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                                                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                            </Text>
                                            <Text className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                {date.getDate()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Time Strip */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                                {times.map((time) => (
                                    <TouchableOpacity
                                        key={time}
                                        onPress={() => setSelectedTime(time)}
                                        className={`mr-3 px-4 py-2 rounded-lg border ${selectedTime === time ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-800'}`}
                                    >
                                        <Text className={`font-bold ${selectedTime === time ? 'text-white' : 'text-slate-400'}`}>{time}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Client Section */}
                        <View className="mb-8">
                            <View className="flex-row items-center mb-4">
                                <User size={18} color="#3b82f6" className="mr-2" />
                                <Text className="font-bold text-slate-300 uppercase text-xs tracking-wider">Informations client</Text>
                            </View>
                            <View className="flex-row gap-3 mb-3">
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-500 mb-1 ml-2">Nom</Text>
                                    <TextInput
                                        className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                        placeholder="Nom"
                                        placeholderTextColor="#64748b"
                                        value={client.nom}
                                        onChangeText={t => setClient({ ...client, nom: t })}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-500 mb-1 ml-2">Prénom</Text>
                                    <TextInput
                                        className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                        placeholder="Prénom"
                                        placeholderTextColor="#64748b"
                                        value={client.prenom}
                                        onChangeText={t => setClient({ ...client, prenom: t })}
                                    />
                                </View>
                            </View>
                            <View className="mb-3">
                                <Text className="text-xs text-slate-500 mb-1 ml-2">Téléphone</Text>
                                <TextInput
                                    className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                    placeholder="06..."
                                    placeholderTextColor="#64748b"
                                    keyboardType="phone-pad"
                                    value={client.telephone}
                                    onChangeText={t => setClient({ ...client, telephone: t })}
                                />
                            </View>
                            <View>
                                <Text className="text-xs text-slate-500 mb-1 ml-2">Email (Optionnel)</Text>
                                <TextInput
                                    className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                    placeholder="client@email.com"
                                    placeholderTextColor="#64748b"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={client.email}
                                    onChangeText={t => setClient({ ...client, email: t })}
                                />
                            </View>
                        </View>

                        {/* Vehicle Section */}
                        <View className="mb-8">
                            <View className="flex-row items-center mb-4">
                                <Car size={18} color="#3b82f6" className="mr-2" />
                                <Text className="font-bold text-slate-300 uppercase text-xs tracking-wider">Informations véhicule</Text>
                            </View>
                            <View className="flex-row gap-3 mb-3">
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-500 mb-1 ml-2">Marque</Text>
                                    <TextInput
                                        className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                        placeholder="Peugeot"
                                        placeholderTextColor="#64748b"
                                        value={vehicle.marque}
                                        onChangeText={t => setVehicle({ ...vehicle, marque: t })}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-500 mb-1 ml-2">Modèle</Text>
                                    <TextInput
                                        className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                        placeholder="308"
                                        placeholderTextColor="#64748b"
                                        value={vehicle.modele}
                                        onChangeText={t => setVehicle({ ...vehicle, modele: t })}
                                    />
                                </View>
                            </View>
                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-500 mb-1 ml-2">Immatriculation</Text>
                                    <TextInput
                                        className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                        placeholder="AA-123-BB"
                                        placeholderTextColor="#64748b"
                                        autoCapitalize="characters"
                                        value={vehicle.immatriculation}
                                        onChangeText={t => setVehicle({ ...vehicle, immatriculation: t })}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-500 mb-1 ml-2">Kilométrage</Text>
                                    <TextInput
                                        className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                        placeholder="120000"
                                        placeholderTextColor="#64748b"
                                        keyboardType="numeric"
                                        value={vehicle.kilometrage}
                                        onChangeText={t => setVehicle({ ...vehicle, kilometrage: t })}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Commentaire Section */}
                        <View className="mb-8">
                            <Text className="text-xs text-slate-500 mb-1 ml-2">Détails de la demande</Text>
                            <TextInput
                                className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white min-h-[100px] mb-4"
                                placeholder="Décrivez le problème ou l'intervention à réaliser..."
                                placeholderTextColor="#64748b"
                                multiline
                                textAlignVertical="top"
                                value={commentaire}
                                onChangeText={setCommentaire}
                            />

                            <Text className="text-xs text-slate-500 mb-1 ml-2">Prix Approximatif (€)</Text>
                            <TextInput
                                className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white font-bold"
                                placeholder="Ex: 150.00"
                                placeholderTextColor="#64748b"
                                keyboardType="numeric"
                                value={estimatedPrice}
                                onChangeText={setEstimatedPrice}
                            />
                        </View>

                        {/* Photos Section */}
                        <View className="mb-8">
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center">
                                    <Camera size={18} color="#3b82f6" className="mr-2" />
                                    <Text className="font-bold text-slate-300 uppercase text-xs tracking-wider">État du véhicule (Photos)</Text>
                                </View>
                                <TouchableOpacity onPress={pickImage} className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/50">
                                    <Text className="text-blue-400 text-xs font-bold">+ Ajouter</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row flex-wrap gap-2">
                                {photos.map((photo, index) => (
                                    <View key={index} className="relative w-[31%] aspect-square rounded-xl bg-slate-800 overflow-hidden border border-slate-700">
                                        <Image source={{ uri: photo.uri }} className="w-full h-full" resizeMode="cover" />
                                        <TouchableOpacity
                                            onPress={() => removePhoto(index)}
                                            className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full"
                                        >
                                            <Trash2 size={12} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {photos.length < 6 && (
                                    <TouchableOpacity onPress={pickImage} className="w-[31%] aspect-square rounded-xl bg-slate-900 border-2 border-dashed border-slate-800 items-center justify-center">
                                        <Camera size={24} color="#475569" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Footer Action */}
                <View className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950 border-t border-slate-900 z-10">
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={loading}
                        className={`bg-blue-600 p-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-900/50 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Save size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-lg">Créer l'intervention</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
